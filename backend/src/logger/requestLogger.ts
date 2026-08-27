import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

const HIDEFIELDS=[
    "password",
    "confirmPassword",
    "password",
    "token",
    "refreshToken"
]

const requestLogger=(req:Request,res:Response,next:NextFunction)=>{

    const dataBody={...req.body};

    for(let field of HIDEFIELDS){
        if(dataBody[field]){
            dataBody[field]="******"
        }
    }

    logger.info(`${req.method} ${req.originalUrl} | body: ${JSON.stringify(dataBody)}`);
    next()
}

export default requestLogger