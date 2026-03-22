import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { WSMessage } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let currentUserId: string | null = null;
    let currentPairCode: string | null = null;

    ws.on("message", (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        switch (message.type) {
          case "join": {
            const { userId, userName, pairCode } = message.payload || {};
            if (!userId || !userName || !pairCode) {
              ws.send(JSON.stringify({
                type: "error",
                payload: { error: "Missing required fields" }
              }));
              return;
            }

            currentUserId = userId;
            currentPairCode = pairCode;

            const room = storage.createOrJoinPairRoom(pairCode, userId, userName, ws);

            const joinedMessage: WSMessage = {
              type: "joined",
              payload: {
                alertState: room.alertState,
                alertByUserId: room.alertByUserId,
                alertByUserName: room.alertByUserName,
                acknowledgedByUserId: room.acknowledgedByUserId,
                acknowledgedByUserName: room.acknowledgedByUserName,
                members: room.members,
              },
            };
            ws.send(JSON.stringify(joinedMessage));

            const stateUpdate: WSMessage = {
              type: "state_update",
              payload: {
                alertState: room.alertState,
                alertByUserId: room.alertByUserId,
                alertByUserName: room.alertByUserName,
                acknowledgedByUserId: room.acknowledgedByUserId,
                acknowledgedByUserName: room.acknowledgedByUserName,
                members: room.members,
              },
            };
            storage.broadcastToRoom(pairCode, stateUpdate, userId);
            break;
          }

          case "leave": {
            const { userId, pairCode } = message.payload || {};
            if (userId && pairCode) {
              storage.leavePairRoom(pairCode, userId);
              
              const room = storage.getPairRoom(pairCode);
              if (room) {
                const stateUpdate: WSMessage = {
                  type: "state_update",
                  payload: {
                    alertState: room.alertState,
                    alertByUserId: room.alertByUserId,
                    alertByUserName: room.alertByUserName,
                    acknowledgedByUserId: room.acknowledgedByUserId,
                    acknowledgedByUserName: room.acknowledgedByUserName,
                    members: room.members,
                  },
                };
                storage.broadcastToRoom(pairCode, stateUpdate);
              }
            }
            break;
          }

          case "alert_on": {
            const { userId, userName, pairCode } = message.payload || {};
            if (!userId || !pairCode) return;

            const room = storage.setAlertState(pairCode, true, userId, userName || null);
            if (room) {
              const stateUpdate: WSMessage = {
                type: "state_update",
                payload: {
                  alertState: true,
                  alertByUserId: userId,
                  alertByUserName: userName || null,
                  acknowledgedByUserId: null,
                  acknowledgedByUserName: null,
                  members: room.members,
                },
              };
              storage.broadcastToRoom(pairCode, stateUpdate);
            }
            break;
          }

          case "alert_off": {
            const { userId, pairCode } = message.payload || {};
            if (!pairCode) return;

            const currentRoom = storage.getPairRoom(pairCode);
            if (currentRoom && currentRoom.alertByUserId === userId) {
              const room = storage.setAlertState(pairCode, false, null, null);
              if (room) {
                const stateUpdate: WSMessage = {
                  type: "state_update",
                  payload: {
                    alertState: false,
                    alertByUserId: null,
                    alertByUserName: null,
                    acknowledgedByUserId: null,
                    acknowledgedByUserName: null,
                    members: room.members,
                  },
                };
                storage.broadcastToRoom(pairCode, stateUpdate);
              }
            }
            break;
          }

          case "alert_ack": {
            const { userId, userName, pairCode } = message.payload || {};
            if (!userId || !userName || !pairCode) return;

            const room = storage.setAcknowledgment(pairCode, userId, userName);
            if (room) {
              const stateUpdate: WSMessage = {
                type: "state_update",
                payload: {
                  alertState: room.alertState,
                  alertByUserId: room.alertByUserId,
                  alertByUserName: room.alertByUserName,
                  acknowledgedByUserId: userId,
                  acknowledgedByUserName: userName,
                  members: room.members,
                },
              };
              storage.broadcastToRoom(pairCode, stateUpdate);
            }
            break;
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        ws.send(JSON.stringify({
          type: "error",
          payload: { error: "Invalid message format" }
        }));
      }
    });

    ws.on("close", () => {
      if (currentUserId && currentPairCode) {
        storage.leavePairRoom(currentPairCode, currentUserId);
        
        const room = storage.getPairRoom(currentPairCode);
        if (room) {
          const stateUpdate: WSMessage = {
            type: "state_update",
            payload: {
              alertState: room.alertState,
              alertByUserId: room.alertByUserId,
              alertByUserName: room.alertByUserName,
              acknowledgedByUserId: room.acknowledgedByUserId,
              acknowledgedByUserName: room.acknowledgedByUserName,
              members: room.members,
            },
          };
          storage.broadcastToRoom(currentPairCode, stateUpdate);
        }
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
