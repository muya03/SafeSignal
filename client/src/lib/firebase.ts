import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove, update, onDisconnect, push, increment, type DatabaseReference, type Unsubscribe } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAZlHs5CU68BbULxce9jZREk4F-viHk6Bo",
  authDomain: "safesignal-1f22c.firebaseapp.com",
  databaseURL: "https://safesignal-1f22c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "safesignal-1f22c",
  storageBucket: "safesignal-1f22c.firebasestorage.app",
  messagingSenderId: "757684065928",
  appId: "1:757684065928:web:5de4dad64c44883e2e313d",
  measurementId: "G-S3003SB92J"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface RoomMessage {
  text: string;
  senderName: string;
  senderId: string;
  timestamp: number;
}

export interface FirebaseRoomData {
  code: string;
  alertState: boolean;
  alertByUserId: string | null;
  alertByUserName: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedByUserName: string | null;
  totalPressCount: number;
  members: Record<string, { odId: string; name: string; lastSeen: number }>;
  messages: Record<string, RoomMessage> | null;
  updatedAt: number;
}

function getRoomRef(pairCode: string): DatabaseReference {
  return ref(database, `rooms/${pairCode.toUpperCase()}`);
}

function getMemberRef(pairCode: string, odId: string): DatabaseReference {
  return ref(database, `rooms/${pairCode.toUpperCase()}/members/${odId}`);
}

export async function joinRoom(pairCode: string, odId: string, userName: string): Promise<FirebaseRoomData | null> {
  const roomRef = getRoomRef(pairCode);
  const memberRef = getMemberRef(pairCode, odId);

  try {
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      await update(roomRef, {
        code: pairCode.toUpperCase(),
        alertState: false,
        alertByUserId: null,
        alertByUserName: null,
        acknowledgedByUserId: null,
        acknowledgedByUserName: null,
        totalPressCount: 0,
        updatedAt: Date.now(),
      });
    }

    const memberData = {
      odId: odId,
      name: userName,
      lastSeen: Date.now(),
    };
    await set(memberRef, memberData);

    await onDisconnect(memberRef).remove();

    const currentSnapshot = await get(roomRef);
    if (currentSnapshot.exists()) {
      const currentData = currentSnapshot.val() as FirebaseRoomData;
      if (currentData.alertByUserId === odId) {
        await onDisconnect(roomRef).update({
          alertState: false,
          alertByUserId: null,
          alertByUserName: null,
          acknowledgedByUserId: null,
          acknowledgedByUserName: null,
          updatedAt: Date.now(),
        });
      }
    }

    const updatedSnapshot = await get(roomRef);
    return updatedSnapshot.val() as FirebaseRoomData;
  } catch (error) {
    console.error("Error joining room:", error);
    return null;
  }
}

export async function leaveRoom(pairCode: string, odId: string): Promise<void> {
  const memberRef = getMemberRef(pairCode, odId);
  const roomRef = getRoomRef(pairCode);

  try {
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const roomData = snapshot.val() as FirebaseRoomData;
      if (roomData.alertByUserId === odId) {
        await update(roomRef, {
          alertState: false,
          alertByUserId: null,
          alertByUserName: null,
          acknowledgedByUserId: null,
          acknowledgedByUserName: null,
          updatedAt: Date.now(),
        });
      }
    }
    await remove(memberRef);
  } catch (error) {
    console.error("Error leaving room:", error);
  }
}

export async function setAlertOn(pairCode: string, odId: string, userName: string): Promise<boolean> {
  const roomRef = getRoomRef(pairCode);

  try {
    await update(roomRef, {
      alertState: true,
      alertByUserId: odId,
      alertByUserName: userName,
      acknowledgedByUserId: null,
      acknowledgedByUserName: null,
      totalPressCount: increment(1),
      updatedAt: Date.now(),
    });

    await onDisconnect(roomRef).update({
      alertState: false,
      alertByUserId: null,
      alertByUserName: null,
      acknowledgedByUserId: null,
      acknowledgedByUserName: null,
      updatedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error("Error setting alert on:", error);
    return false;
  }
}

export async function setAlertOff(pairCode: string, odId: string): Promise<boolean> {
  const roomRef = getRoomRef(pairCode);

  try {
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return false;
    
    const roomData = snapshot.val() as FirebaseRoomData;
    if (roomData.alertByUserId !== odId) return false;
    
    await update(roomRef, {
      alertState: false,
      alertByUserId: null,
      alertByUserName: null,
      acknowledgedByUserId: null,
      acknowledgedByUserName: null,
      updatedAt: Date.now(),
    });

    await onDisconnect(roomRef).cancel();
    return true;
  } catch (error) {
    console.error("Error setting alert off:", error);
    return false;
  }
}

export async function sendAcknowledgment(pairCode: string, odId: string, userName: string): Promise<boolean> {
  const roomRef = getRoomRef(pairCode);

  try {
    await update(roomRef, {
      acknowledgedByUserId: odId,
      acknowledgedByUserName: userName,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Error sending acknowledgment:", error);
    return false;
  }
}

export async function sendMessage(pairCode: string, odId: string, userName: string, text: string): Promise<boolean> {
  const messagesRef = ref(database, `rooms/${pairCode.toUpperCase()}/messages`);

  try {
    const messageData: RoomMessage = {
      text: text.trim(),
      senderName: userName,
      senderId: odId,
      timestamp: Date.now(),
    };
    await push(messagesRef, messageData);
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
}

export async function updatePresence(pairCode: string, odId: string): Promise<void> {
  const memberRef = getMemberRef(pairCode, odId);

  try {
    await update(memberRef, {
      lastSeen: Date.now(),
    });
  } catch (error) {
    console.error("Error updating presence:", error);
  }
}

export function subscribeToRoom(
  pairCode: string,
  callback: (data: FirebaseRoomData | null) => void
): Unsubscribe {
  const roomRef = getRoomRef(pairCode);
  
  return onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as FirebaseRoomData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error subscribing to room:", error);
    callback(null);
  });
}

export function getMembersList(members: Record<string, { odId: string; name: string; lastSeen: number }> | undefined): { id: string; name: string }[] {
  if (!members) return [];
  
  const now = Date.now();
  const STALE_THRESHOLD = 5 * 60 * 1000;
  
  return Object.values(members)
    .filter(member => now - member.lastSeen < STALE_THRESHOLD)
    .map(({ odId, name }) => ({ id: odId, name }));
}

export function getMessagesList(messages: Record<string, RoomMessage> | null | undefined): (RoomMessage & { id: string })[] {
  if (!messages) return [];
  return Object.entries(messages)
    .map(([id, msg]) => ({ id, ...msg }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export { database };
