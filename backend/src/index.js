import "dotenv/config";
import { app } from "./app.js";
import { connectDB } from "./db/dbConfig.js";
import { connectRedis } from "./db/redisConfig.js";
import { validateEnv } from "./config/validateEnv.js";
import passport from "./utils/passport.js";

const PORT = Number(process.env.PORT) || 8000;

const startServer = async () => {
    try {
        validateEnv();

        await connectDB();
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    } catch (error) {
        console.error("Server failed to start");
        console.error(error?.message);
        process.exit(1);
    }
};

startServer();
