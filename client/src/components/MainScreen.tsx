import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { HoldButton } from "./HoldButton";
import { LogOut, Wifi, WifiOff, Users, Check, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RoomMessage } from "@/lib/firebase";

interface MainScreenProps {
  userId: string;
  userName: string;
  pairCode: string;
  isConnected: boolean;
  alertState: boolean;
  alertByUserId: string | null;
  alertByUserName: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedByUserName: string | null;
  totalPressCount: number;
  members: { id: string; name: string }[];
  messages: (RoomMessage & { id: string })[];
  error?: string | null;
  onSendAlert: (alertOn: boolean) => void;
  onSendAcknowledgment: () => void;
  onSendMessage: (text: string) => void;
  onLogout: () => void;
}

export function MainScreen({
  userId,
  userName,
  pairCode,
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
  onSendAlert,
  onSendAcknowledgment,
  onSendMessage,
  onLogout,
}: MainScreenProps) {
  const { toast } = useToast();
  const isAlertOwner = alertByUserId === userId;
  const hasAcknowledged = acknowledgedByUserId === userId;
  const [messageText, setMessageText] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error de conexión",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowMessages(true);
    }
  }, [messages.length]);

  useEffect(() => {
    if (showMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showMessages]);

  const handleActivate = useCallback(() => {
    if (alertState && isAlertOwner) {
      onSendAlert(false);
    } else if (!alertState) {
      onSendAlert(true);
    }
  }, [alertState, isAlertOwner, onSendAlert]);

  const handleAcknowledge = useCallback(() => {
    onSendAcknowledgment();
  }, [onSendAcknowledgment]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText("");
  }, [messageText, onSendMessage]);

  const partnerCount = members.length - 1;

  const getStatusMessage = () => {
    if (!alertState) return "Todo está tranquilo";
    if (isAlertOwner) {
      if (acknowledgedByUserName) return `${acknowledgedByUserName} está contigo`;
      return "Esperando respuesta...";
    }
    return alertByUserName ? `${alertByUserName} te necesita` : "Te necesitan";
  };

  const getSubMessage = () => {
    if (!alertState) return "Estás conectado con tu persona de apoyo";
    if (isAlertOwner) {
      if (acknowledgedByUserName) return "Tu persona de apoyo está contigo";
      return "Tu señal ha sido enviada, aguanta";
    }
    return "Responde cuando puedas";
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-700 safe-top safe-bottom",
        alertState
          ? "bg-gradient-to-b from-rose-400 via-pink-300 to-rose-200"
          : "bg-gradient-to-b from-indigo-700 via-blue-600 to-teal-500"
      )}
    >
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
            "bg-white/20 text-white"
          )}
          data-testid="status-connection"
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {isConnected ? "Conectado" : "Reconectando..."}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/60 font-mono text-xs tracking-widest">
            {pairCode}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
            data-testid="button-logout"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-4 gap-8">
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-white mb-2 leading-tight"
            data-testid="text-status"
          >
            {getStatusMessage()}
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            {getSubMessage()}
          </p>
        </div>

        {alertState && !isAlertOwner ? (
          <button
            type="button"
            onClick={handleAcknowledge}
            disabled={!isConnected || hasAcknowledged}
            className={cn(
              "w-52 h-52 rounded-full flex flex-col items-center justify-center",
              "text-white font-semibold shadow-2xl",
              "active:scale-95 transition-all duration-200",
              "select-none touch-none focus:outline-none",
              hasAcknowledged
                ? "bg-green-500/70 backdrop-blur-sm"
                : "bg-white/25 backdrop-blur-sm border-2 border-white/40",
              !isConnected && "opacity-50"
            )}
            data-testid="button-acknowledge"
            aria-label="Estoy aquí"
          >
            {hasAcknowledged ? (
              <>
                <Check className="w-14 h-14 mb-2" strokeWidth={3} />
                <span className="text-xl font-bold">Enviado</span>
              </>
            ) : (
              <>
                <span className="text-5xl mb-3">🤝</span>
                <span className="text-xl font-bold">Estoy aquí</span>
                <span className="text-sm opacity-70 mt-1">Toca para responder</span>
              </>
            )}
          </button>
        ) : (
          <HoldButton
            onActivate={handleActivate}
            isAlertActive={alertState && isAlertOwner}
            disabled={!isConnected}
            buttonLabel={alertState && isAlertOwner ? "Estoy bien" : "Pedir Ayuda"}
            isAlert={alertState}
          />
        )}

        <button
          type="button"
          onClick={() => setShowMessages(v => !v)}
          className="flex items-center gap-2 text-white/70 text-sm active:text-white transition-colors"
          data-testid="button-toggle-messages"
        >
          <span className="text-base">💬</span>
          {showMessages ? "Ocultar mensajes" : `Mensajes${messages.length > 0 ? ` (${messages.length})` : ""}`}
        </button>
      </main>

      {showMessages && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 max-h-48 overflow-y-auto flex flex-col gap-2">
            {messages.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-2">
                No hay mensajes aún. Escribe algo de apoyo.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%] rounded-xl px-3 py-2",
                    msg.senderId === userId
                      ? "self-end bg-white/30 text-white"
                      : "self-start bg-white/15 text-white"
                  )}
                  data-testid={`message-${msg.id}`}
                >
                  <span className="text-xs opacity-60 mb-0.5">
                    {msg.senderId === userId ? "Tú" : msg.senderName} · {formatTime(msg.timestamp)}
                  </span>
                  <span className="text-sm leading-snug">{msg.text}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Escribe un mensaje..."
              maxLength={200}
              className="flex-1 h-11 px-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60 transition-all"
              data-testid="input-message"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || !isConnected}
              className="w-11 h-11 rounded-xl bg-white/25 flex items-center justify-center active:bg-white/40 transition-colors disabled:opacity-40"
              data-testid="button-send-message"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      <footer className="px-6 pb-6">
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-white/80 text-sm font-medium">
            Hola, {userName}
          </span>
          <div className="flex items-center gap-3 text-white/60 text-xs">
            <span title="Veces que se ha pedido ayuda">
              🔔 {totalPressCount} {totalPressCount === 1 ? "vez" : "veces"}
            </span>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>
                {partnerCount > 0 ? `${partnerCount} conectada${partnerCount > 1 ? "s" : ""}` : "Esperando pareja..."}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
