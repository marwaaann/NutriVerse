import jwt,{SignOptions }from "jsonwebtoken";
import { TokenUserPayload } from "../types/TokenUserPayload";
import { ENV } from "../config/env";

export const generateAccessToken=(payload:TokenUserPayload):string=>{
    return jwt.sign(payload,ENV.ACCESS_TOKEN_SECRET as string,{
        expiresIn:ENV.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]
    });
}

export const generateRefreshToken=(payload:TokenUserPayload):string=>{
    return jwt.sign(payload,ENV.REFRESH_TOKEN_SECRET as string,{
        expiresIn:ENV.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"]
    })
}

export const verifyToken=<T>(token:string,TOKEN_SECRET:string):T=>{
    return jwt.verify(token,TOKEN_SECRET) as T
}

