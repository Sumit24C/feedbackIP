import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URI,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error("Redis reconnect failed");
                return new Error("Redis reconnect failed");
            }
            return Math.min(retries * 100, 3000);
        },
    },
});

redisClient.on("connect", () => {
    console.log("Redis socket connected");
});

redisClient.on("ready", () => {
    console.log("Redis ready to accept commands");
});

redisClient.on("reconnecting", () => {
    console.warn("Redis reconnecting...");
});

redisClient.on("end", () => {
    console.warn("Redis connection closed");
});


redisClient.on("error", (err) => {
    console.error("Redis error:", err.message);
});

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
        } catch (error) {
            throw error
        }
    }
};

export { redisClient, connectRedis };
