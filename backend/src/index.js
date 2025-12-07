import dotenv from "dotenv/config";
import { app } from "./app.js";
import { connectDB } from "./db/dbConfig.js";
import passport from "./utils/passport.js"

const PORT = process.env.PORT || 8000;
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log("server listening on port ", PORT);
        })
    })
    .catch((error) => {
        console.error("MONGODB connection failed ", error);
        process.exit(1);
    })