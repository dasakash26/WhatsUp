import { redisClient } from "./reddisClient";

export class Cache {
  static readonly CONV_TTL = 10;
  static readonly MSG_TTL = 10;

  static async get(key: string) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, data: any, ttl = this.CONV_TTL) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async del(key: string) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  static async delMany(keys: string[]) {
    try {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error(`Cache delete many error for keys ${keys}:`, error);
    }
  }

  static getConvKey(userId: string) {
    return `user_conversations_${userId}`;
  }

  static getMsgKey(conversationId: string) {
    return `conversation_messages_${conversationId}`;
  }

  static async invalidateConvCache(participants: string[]) {
    const keys = participants.map((userId) => this.getConvKey(userId));
    await this.delMany(keys);
  }

  static async invalidateMsgCache(conversationId: string) {
    await this.del(this.getMsgKey(conversationId));
  }

  static async invalidateConvAndMsgs(
    participants: string[],
    conversationId: string
  ) {
    await this.invalidateConvCache(participants);
    await this.invalidateMsgCache(conversationId);
  }
}
