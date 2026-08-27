import mongoose from "mongoose";
import { ENV } from "./env";

export async function connectDB() {
    try{
        const conn=await mongoose.connect(ENV.MONGO_URI as string) 
        console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
    }catch(error){
        console.error("🔴 MongoDB Connection Error:", error);
        process.exit(1);
    }
}

