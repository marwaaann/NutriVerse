import { Response } from "express";
import { ApiResponse } from "../interface/ApiResponse";

export function apiResponse<T>(res: Response<ApiResponse<T>>,statusCode: number,success: boolean,message: string,data?: T):Response {

  return res.status(statusCode).json({
    success,
    message,
    data,
  });
}