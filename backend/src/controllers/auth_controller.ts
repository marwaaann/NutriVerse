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

            logger.info("Account created successfully", { userId: result.id })

            apiResponse<SignupResponseDTO>(res,201,true,"Account created successfully",result)
        } catch (error) {
            logger.error("Signup failed:", error instanceof Error ? error.message : "Unknown error")
            next(error)
        }
    }

    signin=async(req: Request, res: Response, next: NextFunction):Promise<void>=>{
        try {
            const data:SigninRequestDTO=req.body

            logger.debug("Hitted on authController in Signin")

            const result=await this.authService.signin(data)

            logger.info("User authenticated successfully", { userId: result.userId })
            const crossSiteCookies = ENV.NODE_ENV === "production" || ENV.FRONTEND_URL.startsWith("https://");

            res.cookie("accessToken",result.accessToken,{
                httpOnly:true,
                secure: crossSiteCookies,
                sameSite: crossSiteCookies ? "none" : "lax",
                maxAge: 15 * 60 * 1000, // 15 min
            })

            res.cookie("refreshToken",result.refreshToken,{
                httpOnly:true,
                secure: crossSiteCookies,
                sameSite: crossSiteCookies ? "none" : "lax",
                maxAge:7 * 24 * 60 * 60 * 1000 // 7 days
            })

            apiResponse<SigninResponseDTO>(res,200,true,"Login successfully",result)

        } catch (error) {
            logger.error("Signin failed:", error instanceof Error ? error.message : "Unknown error")
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
            logger.error("GetMe failed:", error instanceof Error ? error.message : "Unknown error")
            next(error)
        }
    }

    logout = async(req: Request, res: Response, next: NextFunction):Promise<void>=>{
        try {
            const crossSiteCookies = ENV.NODE_ENV === "production" || ENV.FRONTEND_URL.startsWith("https://");
            res.clearCookie("accessToken",{
                httpOnly:true,
                secure: crossSiteCookies,
                sameSite: crossSiteCookies ? "none" : "lax",
            })

            res.clearCookie("refreshToken",{
                httpOnly:true,
                secure: crossSiteCookies,
                sameSite: crossSiteCookies ? "none" : "lax",
            })

            apiResponse(res,200,true,"Logout successfully",null)
        } catch (error) {
            next(error)
        }
    }

    getAllUsers = async(req: Request, res: Response, next: NextFunction):Promise<void>=>{
        try {
            const { limit = 20, offset = 0 } = req.query;
            const users = await this.authService.getAllUsers(Number(limit), Number(offset));
            apiResponse(res, 200, true, "Users fetched successfully", users);
        } catch (error) {
            next(error)
        }
    }

    updateProfile = async(req: Request, res: Response, next: NextFunction):Promise<void>=>{
        try {
            const userId = req.user?.user_Id;
            if (!userId) {
                throw new AppError("UNAUTHORIZED", 401);
            }
            const { fullname } = req.body;
            const user = await this.authService.updateProfile(userId, { fullname });
            apiResponse(res, 200, true, "Profile updated successfully", user);
        } catch (error) {
            next(error)
        }
    }
}