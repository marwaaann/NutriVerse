import express from "express";
import cors from "cors";
import auth_Routes from "./routes/auth_routes";
import { globalErrorHandler } from "./middlewares/errorHandlerMiddleware";
import cookieparser from "cookie-parser";
import requestLogger from "./logger/requestLogger";
import { ENV } from "./config/env";

const app = express();
const corsOptions = {
  origin: ENV.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(express.json({ limit: "25mb" }));
app.use(cookieparser());

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