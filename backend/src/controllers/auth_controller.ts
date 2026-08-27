import { NextFunction, Request,Response, } from "express"
import { Signup } from "../types/Signup"
import { AuthService } from "../services/auth_service"
import { apiResponse } from "../helpers/apiResponse"
import logger from "../config/logger"
import { SignupRequestDTO, SignupResponseDTO } from "../dtos/signup.dto"
import { IAuthController } from "../interface/IAuthController"
import { IAuthService } from "../interface/IAuthService"
import { SigninRequestDTO, SigninResponseDTO } from "../dtos/signin.dto"
import { ENV } from "../config/env"
import { TokenUserPayload } from "../types/TokenUserPayload"
import { AppError } from "../utils/AppError"
import { GetMeResponseDTO } from "../dtos/getMeResponse.dto"

export class AuthController implements IAuthController{
    constructor(private authService:IAuthService){}

    signup=async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
        try {
            logger.debug("Hitted AuthController in Signup fn")

            const signupData:SignupRequestDTO=req.body

            const result=await this.authService.signup(signupData)

            console.log("Result : ",result)

            apiResponse<SignupResponseDTO>(res,201,true,"Account created successfully",result)
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    signin=async(req: Request, res: Response, next: NextFunction):Promise<void>=>{
        try {
            const data:SigninRequestDTO=req.body

            logger.debug("Hitted on authController")

            const result=await this.authService.signin(data)

            console.log("result : ",result)

            res.cookie("accessToken",result.accessToken,{
                httpOnly:true,
                secure:ENV.NODE_ENV==="production",
                sameSite:"strict",
                maxAge: 15 * 60 * 1000, // 15 min
            })

            res.cookie("refreshToken",result.refreshToken,{
                httpOnly:true,
                secure:ENV.NODE_ENV==="production",
                sameSite:"strict",
                maxAge:7 * 24 * 60 * 60 * 1000 // 7 days
            })

            apiResponse<SigninResponseDTO>(res,200,true,"Login successfully",result)

        } catch (error) {
            console.log(error)
            next(error)
        }
    }
    getMe=async(req: Request, res: Response, next: NextFunction):Promise<void>=>{
        try {
            const userId=req.user?.user_Id;

            if(!userId){
                throw new AppError("UNAUTHORIZED",401)
            }

            const user=await this.authService.getMe(userId)

            apiResponse<GetMeResponseDTO>(res,200,true,"USER_FETCHED",user)
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
    
}