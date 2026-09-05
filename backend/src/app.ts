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

import { recipeController, notificationController, agentController } from "./container/container";
import { createRecipeRoutes } from "./routes/recipe_routes";
import { createNotificationRoutes } from "./routes/notification_routes";
import mealplannerRoutes from "./routes/mealplanner_routes";
import { createAgentRoutes } from "./routes/agent_routes";

app.use("/api/recipes", createRecipeRoutes(recipeController));
app.use("/api/notifications", createNotificationRoutes(notificationController));
app.use("/api/mealplanner", mealplannerRoutes);
app.use("/api/agent", createAgentRoutes(agentController));

app.use(globalErrorHandler)

export default app;