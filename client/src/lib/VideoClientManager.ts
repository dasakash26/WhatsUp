import { StreamVideoClient, Call } from "@stream-io/video-react-sdk";

interface ClientConfig {
  apiKey: string;
  userId: string;
  token: string;
}

class VideoClientManager {
  private static instance: VideoClientManager;
  private client: StreamVideoClient | null = null;
  private activeCalls: Map<string, Call> = new Map();

  private constructor() {}

  static getInstance(): VideoClientManager {
    if (!VideoClientManager.instance) {
      VideoClientManager.instance = new VideoClientManager();
    }
    return VideoClientManager.instance;
  }

  async getOrCreateClient(config: ClientConfig): Promise<StreamVideoClient> {
    if (this.client) {
      console.log("Reusing existing StreamVideoClient instance");
      return this.client;
    }

    console.log("Creating new StreamVideoClient instance");
    this.client = new StreamVideoClient({
      apiKey: config.apiKey,
      user: { id: config.userId },
      token: config.token,
    });

    return this.client;
  }

  async createCall(callType: string, callId: string): Promise<Call> {
    if (!this.client) {
      throw new Error("Client not initialized. Call getOrCreateClient first.");
    }

    const existingCall = this.activeCalls.get(callId);
    if (existingCall) {
      console.log(`Reusing existing call for ${callId}`);
      return existingCall;
    }

    console.log(`Creating new call for ${callId}`);
    const call = this.client.call(callType, callId);
    this.activeCalls.set(callId, call);
    return call;
  }

  async joinCall(
    callId: string,
    options?: { create?: boolean }
  ): Promise<Call> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Call ${callId} not found. Create it first.`);
    }

    try {
      await call.join(options);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("shall be called only once")
      ) {
        console.log(`Call ${callId} is already joined, reusing existing call`);
        return call;
      }
      throw error;
    }

    return call;
  }

  leaveCall(callId: string): void {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.leave().catch(console.error);
      this.activeCalls.delete(callId);
    }
  }

  disconnectClient(): void {
    if (this.client) {
      this.client.disconnectUser().catch(console.error);
      this.client = null;
      this.activeCalls.clear();
    }
  }

  getActiveCalls(): string[] {
    console.log("Active calls:", Array.from(this.activeCalls.keys()));
    return Array.from(this.activeCalls.keys());
  }
}

export default VideoClientManager;
