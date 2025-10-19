import { DB_NAME } from "../constants.js"
import mongoose from "mongoose"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("MONGODB connected | DB HOST: ", connectionInstance.connection.host);
    } catch (error) {
        console.error("MONGODB connection failed ", error);
        throw error;
    }
}

export { connectDB };