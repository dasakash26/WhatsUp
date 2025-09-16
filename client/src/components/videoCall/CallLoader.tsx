import { Video } from 'lucide-react';

const CallLoader = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-black text-white">
      <div className="text-center space-y-4">
        <Video className="h-12 w-12 mx-auto text-blue-400 animate-pulse" />
        <p className="text-lg">Initializing Video call...</p>
      </div>
    </div>
  );
}

export default CallLoader