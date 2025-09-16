import {
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  CallControls,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useCall } from "@/hooks/useCall";
import CallLoader from "./CallLoader";
import CallError from "./CallError";

interface VideoCallProps {
  onError?: (error: string) => void;
  conversationId?: string;
}

export default function VideoCall({
  conversationId,
  onError,
}: VideoCallProps = {}) {
  const { client, call, loading, error } = useCall(conversationId, onError);

  if (loading || !client || !call) {
    return <CallLoader />;
  }
  if (error) {
    return <CallError error={error} />;
  }
  
  return (
    <div className="h-full w-full bg-black relative overflow-hidden">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme className="h-full w-full">
            <div className="relative h-full w-full">
              <SpeakerLayout participantsBarPosition="bottom" />

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[100]">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <CallControls
                    onLeave={() => {
                      console.log("User is leaving the call");
                    }}
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
