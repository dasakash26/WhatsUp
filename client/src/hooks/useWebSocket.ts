import { useCallback, useRef, useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { WebSocketMessage } from "../types/websocket.types";

type UseWebSocketOptions = {
  onMessage: (data: WebSocketMessage) => void;
};

export const useWebSocket = ({ onMessage }: UseWebSocketOptions) => {
  const [connectionState, setConnectionState] = useState<{
    isConnected: boolean;
    error: string | null;
  }>({ isConnected: false, error: null });
  const wsRef = useRef<WebSocket | null>(null);
  const { getToken } = useAuth();
  const messageQueue = useRef<WebSocketMessage[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false);
  const RECONNECT_INTERVAL = 3000;

  const connect = useCallback(async () => {
    if (
      isConnecting.current ||
      (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    isConnecting.current = true;

    try {
      const token = await getToken();
      if (!token) {
        setConnectionState({
          isConnected: false,
          error: "No authentication token available",
        });
        isConnecting.current = false;
        return;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const wsUrl = `${import.meta.env.VITE_WS_URL}?clerkToken=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnectionState({ isConnected: true, error: null });
        isConnecting.current = false;

        if (messageQueue.current.length > 0) {
          messageQueue.current.forEach((msg) => ws.send(JSON.stringify(msg)));
          messageQueue.current = [];
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = () => {
        setConnectionState({
          isConnected: false,
          error: "Connection error occurred",
        });
        isConnecting.current = false;
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setConnectionState({ isConnected: false, error: null });
        isConnecting.current = false;

        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setConnectionState({
        isConnected: false,
        error: "Failed to establish connection",
      });
      isConnecting.current = false;
      scheduleReconnect();
    }
  }, [getToken, onMessage]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, RECONNECT_INTERVAL);
  }, [connect]);

  const sendMessage = useCallback(
    (message: WebSocketMessage): boolean => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        messageQueue.current.push(message);
        if (!isConnecting.current) {
          connect();
        }
        return false;
      }

      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        messageQueue.current.push(message);
        return false;
      }
    },
    [connect]
  );

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected: connectionState.isConnected,
    connectionError: connectionState.error,
    sendMessage,
    connect,
  };
};
