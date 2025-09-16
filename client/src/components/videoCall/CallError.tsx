import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

const CallError = ({ error }: { error: string }) => {
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
};

export default CallError;
