import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "../utils/jwt";
import { ENV } from "../config/env";
import { TokenUserPayload } from "../types/TokenUserPayload";
import { ChatHandler } from "./chat.handler";
import logger from "../config/logger";

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookieStr) => {
    const parts = cookieStr.split("=");
    const name = parts[0].trim();
    if (name) {
      cookies[name] = parts.slice(1).join("=").trim();
    }
  });
  return cookies;
};

export const initializeWebSocketServer = (httpServer: HttpServer): WebSocketServer => {
  const wss = new WebSocketServer({ noServer: true });
  const chatHandler = new ChatHandler();

  httpServer.on("upgrade", (request, socket, head) => {
    try {
      const cookies = parseCookies(request.headers.cookie);
      const accessToken = cookies.accessToken;

      if (!accessToken) {
        logger.warn("WebSocket Upgrade failed: No access token provided");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const decoded = verifyToken<TokenUserPayload>(accessToken, ENV.ACCESS_TOKEN_SECRET);
      if (!decoded || !decoded.user_Id) {
        logger.warn("WebSocket Upgrade failed: Invalid access token");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, decoded.user_Id);
      });
    } catch (error) {
      logger.error("WebSocket upgrade error:", error);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket, userId: string) => {
    logger.info("[CHAT] WebSocket connected");
    logger.info("[CHAT] User authenticated");
    logger.info(`WebSocket client connected: user ${userId}`);

    ws.on("message", async (message: string) => {
      logger.debug(`Received WebSocket message from user ${userId}`);
      await chatHandler.handleMessage(ws, userId, message.toString());
    });

    ws.on("close", () => {
      logger.info(`WebSocket client disconnected: user ${userId}`);
    });

    ws.on("error", (error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });
  });

  return wss;
};
