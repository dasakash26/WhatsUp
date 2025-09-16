import VideoClientManager from "@/lib/VideoClientManager";
import { useUser } from "@clerk/clerk-react";
import { Call, StreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

export function useCall(conversationId?: string, onError?: (error: string) => void) {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useUser();

    useEffect(() => {
      const init = async () => {
        if (!user?.id) {
          const errorMsg = "User not authenticated";
          setError(errorMsg);
          setLoading(false);
          onError?.(errorMsg);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/get-token?user_id=${user.id}`
          );

          if (!res.ok) {
            throw new Error(`Failed to get token: ${res.status}`);
          }

          const { token, apiKey, userId } = await res.json();

          const manager = VideoClientManager.getInstance();
          const streamClient = await manager.getOrCreateClient({
            apiKey,
            userId,
            token,
          });

          if (!conversationId) {
            const errorMsg = "Conversation ID is required to join a call";
            setError(errorMsg);
            setLoading(false);
            onError?.(errorMsg);
            return;
          }

          const streamCall = await manager.createCall(
            "default",
            conversationId
          );
          await manager.joinCall(conversationId, { create: true });

          setClient(streamClient);
          setCall(streamCall);
        } catch (error) {
          console.error("Error initializing video call:", error);
          const errorMsg =
            error instanceof Error
              ? error.message
              : "Failed to initialize video call";
          setError(errorMsg);
          onError?.(errorMsg);
        } finally {
          setLoading(false);
        }
      };

      init();

      return () => {
        if (conversationId) {
          const manager = VideoClientManager.getInstance();
          manager.leaveCall(conversationId);
        }
      };
    }, [user?.id, onError, conversationId]);

    return { client, call, loading, error };
}