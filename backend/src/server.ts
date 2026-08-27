import dotenv from "dotenv";
dotenv.config()
import app from "./app"
import { connectDB } from "./config/connectDB";
import { ENV } from "./config/env";



connectDB();
const PORT:number = Number(ENV.PORT)|| 5000
app.listen(PORT,()=>{
    console.log(`🚀 Server running at http://localhost:${PORT}`);
})  