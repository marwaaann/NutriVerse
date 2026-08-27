import express from "express";
import cors from "cors";
import auth_Routes from "./routes/auth_routes";
import { globalErrorHandler } from "./middlewares/errorHandlerMiddleware";
import cookieparser from "cookie-parser";
import requestLogger from "./logger/requestLogger";
import { ENV } from "./config/env";

console.log(ENV.FRONTEND_URL)

const app = express();

app.use(cors(
    {
    origin:ENV.FRONTEND_URL,
    credentials:true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
));
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(cookieparser())

app.use(requestLogger)
app.use("/auth",auth_Routes)

app.use(globalErrorHandler)

export default app;