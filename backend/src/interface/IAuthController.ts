import { NextFunction, Request, Response } from "express";

export interface IAuthController {
  signup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  signin:(req:Request,res:Response,next:NextFunction)=>Promise<void>;
  getMe:(req:Request,res:Response,next:NextFunction)=>Promise<void>;
}