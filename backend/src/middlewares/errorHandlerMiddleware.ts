import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { apiResponse } from "../helpers/apiResponse";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("ERROR:", err);

  // ✅ Known (operational) error
  if (err instanceof AppError && err.isOperational) {
    return apiResponse(res, err.statusCode, false, err.message);
  }

  // ❌ Unknown error
  return apiResponse(res, 500, false, "Something went wrong");
};