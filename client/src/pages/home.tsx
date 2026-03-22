import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PairingScreen } from "@/components/PairingScreen";
import { MainScreen } from "@/components/MainScreen";
import { useFirebaseRoom } from "@/hooks/use-firebase-room";
import { saveUserData, getUserData, clearUserData, type StoredUser } from "@/lib/storage";
import { initPushNotifications, createNotificationChannels } from "@/lib/push-notifications";
import { setupAppListeners } from "@/lib/native-utils";
import type { PairingData } from "@shared/schema";

export default function Home() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getUserData();
    setUser(stored);
    setIsLoading(false);

    // Always init notifications (web + native)
    createNotificationChannels();
    initPushNotifications().then((token) => {
      if (token) {
        console.log("Push token registered:", token);
      }
    });
  }, []);

  const handlePaired = useCallback((data: PairingData) => {
    const storedUser = saveUserData(data);
    setUser(storedUser);
  }, []);

  const handleLogout = useCallback(() => {
    clearUserData();
    setUser(null);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-600 via-purple-500 to-emerald-500 flex flex-col items-center justify-center safe-top safe-bottom">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-white/60 text-sm">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <PairingScreen onPaired={handlePaired} />;
  }

  return (
    <ConnectedMainScreen
      user={user}
      onLogout={handleLogout}
    />
  );
}

interface ConnectedMainScreenProps {
  user: StoredUser;
  onLogout: () => void;
}

function ConnectedMainScreen({ user, onLogout }: ConnectedMainScreenProps) {
  const { 
    isConnected, 
    alertState, 
    alertByUserId,
    alertByUserName, 
    acknowledgedByUserId,
    acknowledgedByUserName,
    totalPressCount,
    members,
    messages,
    error,
    sendAlert,
    sendAcknowledgment,
    sendMessage,
    reconnect
  } = useFirebaseRoom({
    odId: user.id,
    userName: user.name,
    pairCode: user.pairCode,
  });

  useEffect(() => {
    const cleanup = setupAppListeners({
      onResume: () => {
        console.log("App resumed, reconnecting...");
        reconnect();
      },
      onPause: () => {
        console.log("App paused");
      },
      onBackButton: () => {
        return false;
      },
    });

    return cleanup;
  }, [reconnect]);

  return (
    <MainScreen
      userId={user.id}
      userName={user.name}
      pairCode={user.pairCode}
      isConnected={isConnected}
      alertState={alertState}
      alertByUserId={alertByUserId}
      alertByUserName={alertByUserName}
      acknowledgedByUserId={acknowledgedByUserId}
      acknowledgedByUserName={acknowledgedByUserName}
      totalPressCount={totalPressCount}
      members={members}
      messages={messages}
      error={error}
      onSendAlert={sendAlert}
      onSendAcknowledgment={sendAcknowledgment}
      onSendMessage={sendMessage}
      onLogout={onLogout}
    />
  );
}
