import { useEffect, useState } from "react";
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  CallControls,
  StreamTheme,
  Call,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Video } from "lucide-react";
import VideoClientManager from "@/lib/VideoClientManager";

interface VideoCallProps {
  onError?: (error: string) => void;
  conversationId?: string;
}

export default function VideoCall({
  conversationId,
  onError,
}: VideoCallProps = {}) {
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

        const streamCall = await manager.createCall("default", conversationId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-black text-white">
        <div className="text-center space-y-4">
          <div className="relative">
            <Video className="h-16 w-16 mx-auto text-blue-400 animate-pulse" />
            <Loader2 className="h-6 w-6 absolute -bottom-1 -right-1 text-blue-400 animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Connecting to video call</h3>
            <p className="text-sm text-gray-400">
              Please wait while we connect you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-black text-white">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="space-y-4">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-400" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Connection Failed</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-black text-white">
        <div className="text-center space-y-4">
          <Video className="h-12 w-12 mx-auto text-blue-400 animate-pulse" />
          <p className="text-lg">Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black relative overflow-hidden">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme className="h-full w-full">
            <div className="relative h-full w-full">
              <SpeakerLayout
                participantsBarPosition="bottom"
                ParticipantViewUIBar={null}
              />

              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2">
                  <CallControls
                    onLeave={() => {
                      console.log("User is leaving the call");
                    }}
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
