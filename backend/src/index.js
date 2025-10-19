import { app } from "app.js"
import { connectDB } from "./db/dbConfig.js"
import dotenv from "dotenv"
dotenv.config()

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