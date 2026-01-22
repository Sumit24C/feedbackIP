const requiredEnvVars = [
    "PORT",
    "CORS_ORIGIN",
    "NODE_ENV",

    "MONGO_URI",
    "DB_NAME",
    "REDIS_URI",

    "ACCESS_TOKEN_EXPIRY",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",
    "REFRESH_TOKEN_SECRET",

    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",

    "CRON_SECRET",
];

export function validateEnv() {
    const missing = requiredEnvVars.filter(
        (key) => !process.env[key]
    );

    if (missing.length > 0) {
        console.error("Missing required environment variables:");
        missing.forEach((key) => console.error(`   - ${key}`));
        process.exit(1);
    }
}
