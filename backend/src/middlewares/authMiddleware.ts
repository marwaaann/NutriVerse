import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";
import { ENV } from "../config/env";
import { TokenUserPayload } from "../types/TokenUserPayload";


export const authMiddleware=(req:Request,res:Response,next:NextFunction)=>{
    try {
        let accessToken = req.cookies.accessToken;

        if (!accessToken && req.headers.authorization) {
            const parts = req.headers.authorization.split(" ");
            if (parts.length === 2 && parts[0] === "Bearer") {
                accessToken = parts[1];
            }
        }

        if(!accessToken){
            throw new AppError("NOT_AUTHENTICATED",401)
        }

        const decoded=verifyToken<TokenUserPayload>(accessToken,ENV.ACCESS_TOKEN_SECRET) 

        if(!decoded?.user_Id){
            throw new AppError("INVALID_TOKEN",401)
        }

        req.user=decoded  as TokenUserPayload;

        next()

    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError("INVALID_TOKEN", 401));
        }
    }
}