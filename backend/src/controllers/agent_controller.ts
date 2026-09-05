import { NextFunction, Request, Response } from "express";
import { IRecipeAgentService } from "../interface/IRecipeAgentService";
import { apiResponse } from "../helpers/apiResponse";
import { AppError } from "../utils/AppError";
import logger from "../config/logger";
import { RecipeQueryInput } from "../validators/agentValidation";

export class AgentController {
  constructor(private recipeAgentService: IRecipeAgentService) {}

  recipeQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.debug("AgentController: Handling recipe query request");

      const { query } = req.body as RecipeQueryInput;

      const agentResult = await this.recipeAgentService.executeAgentQuery(query);

      apiResponse(
        res,
        200,
        true,
        "Agent query executed successfully",
        agentResult
      );
    } catch (error) {
      logger.error("Error in AgentController recipeQuery:", error);
      next(error);
    }
  };
}
