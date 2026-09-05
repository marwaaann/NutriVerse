import dotenv from "dotenv";
dotenv.config()
import app from "./app"
import { connectDB } from "./config/connectDB";
import { ENV } from "./config/env";



import { migrateMissingNutrition } from "./config/migrateNutrition";

connectDB().then(() => {
  migrateMissingNutrition();
});
const PORT:number = Number(ENV.PORT)|| 5000
const server = app.listen(PORT,()=>{
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

import { initializeWebSocketServer } from "./websocket/websocket.server";
initializeWebSocketServer(server);  