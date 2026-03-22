import { z } from "zod";

export const pairingSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50),
  pairCode: z.string().min(3, "El código debe tener al menos 3 caracteres").max(20),
});

export type PairingData = z.infer<typeof pairingSchema>;

export interface PairRoom {
  code: string;
  members: { id: string; name: string }[];
  alertState: boolean;
  alertByUserId: string | null;
  alertByUserName: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedByUserName: string | null;
}

export interface User {
  id: string;
  name: string;
  pairCode: string;
}

export type WSMessageType = 
  | "join"
  | "leave"
  | "alert_on"
  | "alert_off"
  | "alert_ack"
  | "state_update"
  | "error"
  | "joined";

export interface WSMessage {
  type: WSMessageType;
  payload?: {
    userId?: string;
    userName?: string;
    pairCode?: string;
    alertState?: boolean;
    alertByUserId?: string | null;
    alertByUserName?: string | null;
    acknowledgedByUserId?: string | null;
    acknowledgedByUserName?: string | null;
    members?: { id: string; name: string }[];
    error?: string;
  };
}
