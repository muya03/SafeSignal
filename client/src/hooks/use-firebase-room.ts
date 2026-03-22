import { useState, useEffect, useCallback, useRef } from "react";
import {
  joinRoom,
  leaveRoom,
  setAlertOn,
  setAlertOff,
  sendAcknowledgment as sendAck,
  sendMessage as sendMsg,
  updatePresence,
  subscribeToRoom,
  getMembersList,
  getMessagesList,
  type FirebaseRoomData,
  type RoomMessage,
} from "@/lib/firebase";
import {
  playNotificationSound,
  triggerVibration,
  triggerAlertHaptic,
  triggerSuccessHaptic,
} from "@/lib/audio";
import { showNotification } from "@/lib/push-notifications";

interface UseFirebaseRoomOptions {
  odId: string;
  userName: string;
  pairCode: string;
}

interface FirebaseRoomState {
  isConnected: boolean;
  alertState: boolean;
  alertByUserId: string | null;
  alertByUserName: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedByUserName: string | null;
  totalPressCount: number;
  members: { id: string; name: string }[];
  messages: (RoomMessage & { id: string })[];
  error: string | null;
}

export function useFirebaseRoom({ odId, userName, pairCode }: UseFirebaseRoomOptions) {
  const [state, setState] = useState<FirebaseRoomState>({
    isConnected: false,
    alertState: false,
    alertByUserId: null,
    alertByUserName: null,
    acknowledgedByUserId: null,
    acknowledgedByUserName: null,
    totalPressCount: 0,
    members: [],
    messages: [],
    error: null,
  });

  // Track previous values to detect changes
  const prevAlertState = useRef<boolean>(false);
  const prevAlertByUserId = useRef<string | null>(null);
  const prevAckUserId = useRef<string | null>(null);
  const prevMemberIds = useRef<Set<string>>(new Set());
  const prevMessageCount = useRef<number>(0);
  const prevLastMessageId = useRef<string | null>(null);

  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isFirstUpdateRef = useRef<boolean>(true);

  const handleRoomUpdate = useCallback(async (data: FirebaseRoomData | null) => {
    if (!data) {
      setState(prev => ({ ...prev, isConnected: false, error: "Room not found" }));
      return;
    }

    const newAlertState = data.alertState;
    const alertByUserId = data.alertByUserId;
    const alertByUserName = data.alertByUserName;
    const acknowledgedByUserId = data.acknowledgedByUserId;
    const acknowledgedByUserName = data.acknowledgedByUserName;
    const totalPressCount = data.totalPressCount ?? 0;
    const members = getMembersList(data.members);
    const messages = getMessagesList(data.messages);
    const isFirst = isFirstUpdateRef.current;

    if (!isFirst) {
      // --- Alert activated ---
      if (newAlertState && !prevAlertState.current) {
        // Only notify if it's NOT me who triggered it
        if (alertByUserId !== odId) {
          const who = alertByUserName ?? "Tu pareja";
          await triggerAlertHaptic();
          await playNotificationSound();
          await showNotification('alert_on', `${who} necesita tu apoyo ahora mismo`);
        }
      }

      // --- Alert deactivated ---
      if (!newAlertState && prevAlertState.current) {
        if (prevAlertByUserId.current !== odId) {
          const who = prevAlertByUserId.current ? alertByUserName ?? "Tu pareja" : "Tu pareja";
          await triggerSuccessHaptic();
          await showNotification('alert_off', `${who} está bien ahora`);
        }
      }

      // --- Partner acknowledged ("Estoy aquí") ---
      if (
        acknowledgedByUserId &&
        acknowledgedByUserId !== prevAckUserId.current &&
        alertByUserId === odId &&
        acknowledgedByUserId !== odId
      ) {
        const who = acknowledgedByUserName ?? "Tu pareja";
        await triggerSuccessHaptic();
        await playNotificationSound();
        await showNotification('acknowledged', `${who} está contigo`);
      }

      // --- Partner joined ---
      const currentMemberIds = new Set(members.map(m => m.id));
      for (const member of members) {
        if (!prevMemberIds.current.has(member.id) && member.id !== odId) {
          await showNotification('partner_joined', `${member.name} se ha conectado`);
          await triggerVibration();
        }
      }

      // --- Partner left ---
      for (const prevId of prevMemberIds.current) {
        if (!currentMemberIds.has(prevId) && prevId !== odId) {
          const leftName = Array.from(prevMemberIds.current)
            .map(() => prevId)
            .join('');
          await showNotification('partner_left', `Tu pareja de apoyo se ha desconectado`);
        }
      }

      // --- New message ---
      if (messages.length > prevMessageCount.current) {
        const newest = messages[messages.length - 1];
        if (
          newest &&
          newest.id !== prevLastMessageId.current &&
          newest.senderId !== odId
        ) {
          await triggerVibration();
          await showNotification('message', `${newest.senderName}: ${newest.text}`);
        }
      }

      prevMemberIds.current = new Set(members.map(m => m.id));
    } else {
      // First update — just record state, don't notify
      prevMemberIds.current = new Set(members.map(m => m.id));
      isFirstUpdateRef.current = false;
    }

    prevAlertState.current = newAlertState;
    prevAlertByUserId.current = alertByUserId;
    prevAckUserId.current = acknowledgedByUserId;
    prevMessageCount.current = messages.length;
    prevLastMessageId.current = messages.length > 0 ? messages[messages.length - 1].id : null;

    setState({
      isConnected: true,
      alertState: newAlertState,
      alertByUserId,
      alertByUserName,
      acknowledgedByUserId,
      acknowledgedByUserName,
      totalPressCount,
      members,
      messages,
      error: null,
    });
  }, [odId]);

  const connect = useCallback(async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
    isFirstUpdateRef.current = true;

    try {
      const room = await joinRoom(pairCode, odId, userName);
      
      if (!room) {
        setState(prev => ({ ...prev, isConnected: false, error: "No se pudo conectar a Firebase. Revisa las reglas de la base de datos." }));
        isConnectingRef.current = false;
        return;
      }

      unsubscribeRef.current = subscribeToRoom(pairCode, handleRoomUpdate);

      presenceIntervalRef.current = setInterval(() => {
        updatePresence(pairCode, odId);
      }, 30000);

      setState(prev => ({ ...prev, isConnected: true, error: null }));
    } catch (error) {
      console.error("Error connecting to Firebase:", error);
      setState(prev => ({ ...prev, isConnected: false, error: "Connection failed" }));
    } finally {
      isConnectingRef.current = false;
    }
  }, [pairCode, odId, userName, handleRoomUpdate]);

  const disconnect = useCallback(async () => {
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    await leaveRoom(pairCode, odId);
  }, [pairCode, odId]);

  const sendAlert = useCallback(async (alertOn: boolean) => {
    try {
      const success = alertOn
        ? await setAlertOn(pairCode, odId, userName)
        : await setAlertOff(pairCode, odId);
      if (!success) {
        setState(prev => ({ ...prev, error: "Failed to update alert" }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: "Failed to send alert" }));
    }
  }, [pairCode, odId, userName]);

  const sendAcknowledgment = useCallback(async () => {
    try {
      const success = await sendAck(pairCode, odId, userName);
      if (!success) {
        setState(prev => ({ ...prev, error: "Failed to send acknowledgment" }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: "Failed to send acknowledgment" }));
    }
  }, [pairCode, odId, userName]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      const success = await sendMsg(pairCode, odId, userName, text);
      if (!success) {
        setState(prev => ({ ...prev, error: "Failed to send message" }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: "Failed to send message" }));
    }
  }, [pairCode, odId, userName]);

  const reconnect = useCallback(() => {
    disconnect().then(() => {
      setTimeout(() => connect(), 500);
    });
  }, [disconnect, connect]);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  return {
    ...state,
    sendAlert,
    sendAcknowledgment,
    sendMessage,
    reconnect,
  };
}
