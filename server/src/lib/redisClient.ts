import { REDIS_PASSWORD, REDIS_URL } from "../utils/secrets";
import { createClient } from "redis";

class RedisClient {
    private static instance: RedisClient;
    private client;

    private constructor() {
        this.client = createClient({
            url: REDIS_URL,
            username: "default",
            password: REDIS_PASSWORD,
        });

        this.client.on("error", (err) => console.log("Redis Client Error", err));

        this.client.connect().then(() => {
            console.log("Connected to Redis");
        }).catch((err) => {
            console.error("Failed to connect to Redis", err);
        });
    }

    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    public getClient() {
        return this.client;
    }
}

export const redisClient = RedisClient.getInstance().getClient();
