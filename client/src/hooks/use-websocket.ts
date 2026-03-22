import { useState, useEffect, useCallback, useRef } from "react";
import type { WSMessage } from "@shared/schema";
import { playNotificationSound, triggerVibration } from "@/lib/audio";

interface UseWebSocketOptions {
  userId: string;
  userName: string;
  pairCode: string;
  onStateChange?: (alertState: boolean, alertByUserName: string | null) => void;
}

interface WebSocketState {
  isConnected: boolean;
  alertState: boolean;
  alertByUserId: string | null;
  alertByUserName: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedByUserName: string | null;
  members: { id: string; name: string }[];
  error: string | null;
}

export function useWebSocket({ userId, userName, pairCode, onStateChange }: UseWebSocketOptions) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    alertState: false,
    alertByUserId: null,
    alertByUserName: null,
    acknowledgedByUserId: null,
    acknowledgedByUserName: null,
    members: [],
    error: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousAlertState = useRef<boolean>(false);
  const previousAckUserId = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setState(prev => ({ ...prev, isConnected: true, error: null }));
      
      const joinMessage: WSMessage = {
        type: "join",
        payload: { userId, userName, pairCode },
      };
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case "joined":
          case "state_update":
            const newAlertState = message.payload?.alertState ?? false;
            const alertByUserId = message.payload?.alertByUserId ?? null;
            const alertByUserName = message.payload?.alertByUserName ?? null;
            const acknowledgedByUserId = message.payload?.acknowledgedByUserId ?? null;
            const acknowledgedByUserName = message.payload?.acknowledgedByUserName ?? null;
            
            if (newAlertState && !previousAlertState.current) {
              playNotificationSound();
              triggerVibration();
            }
            
            if (acknowledgedByUserId && acknowledgedByUserId !== previousAckUserId.current && alertByUserId === userId) {
              playNotificationSound();
              triggerVibration();
            }
            
            previousAlertState.current = newAlertState;
            previousAckUserId.current = acknowledgedByUserId;
            
            setState(prev => ({
              ...prev,
              alertState: newAlertState,
              alertByUserId,
              alertByUserName,
              acknowledgedByUserId,
              acknowledgedByUserName,
              members: message.payload?.members ?? prev.members,
            }));
            
            onStateChange?.(newAlertState, alertByUserName);
            break;
            
          case "error":
            setState(prev => ({ ...prev, error: message.payload?.error ?? "Error desconocido" }));
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, isConnected: false }));
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      setState(prev => ({ ...prev, error: "Error de conexión" }));
    };
  }, [userId, userName, pairCode, onStateChange]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      const leaveMessage: WSMessage = {
        type: "leave",
        payload: { userId, pairCode },
      };
      wsRef.current.send(JSON.stringify(leaveMessage));
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [userId, pairCode]);

  const sendAlert = useCallback((alertOn: boolean) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    const message: WSMessage = {
      type: alertOn ? "alert_on" : "alert_off",
      payload: { userId, userName, pairCode },
    };
    wsRef.current.send(JSON.stringify(message));
  }, [userId, userName, pairCode]);

  const sendAcknowledgment = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    const message: WSMessage = {
      type: "alert_ack",
      payload: { userId, userName, pairCode },
    };
    wsRef.current.send(JSON.stringify(message));
  }, [userId, userName, pairCode]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    sendAlert,
    sendAcknowledgment,
    reconnect: connect,
  };
}
