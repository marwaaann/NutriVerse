import { Router } from "express";
import { AgentController } from "../controllers/agent_controller";
import { validate } from "../middlewares/validationMiddleware";
import { recipeQuerySchema } from "../validators/agentValidation";
import { authMiddleware } from "../middlewares/authMiddleware";

export const createAgentRoutes = (agentController: AgentController): Router => {
  const router = Router();

  // Protect agent query endpoint (requires authentication)
  router.use(authMiddleware);

  router.post("/recipe-query", validate(recipeQuerySchema), agentController.recipeQuery);

  return router;
};
