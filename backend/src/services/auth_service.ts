import { Signup } from "../types/Signup";
import UserRepository from "../repository/user_repository"
import { AppError } from "../utils/AppError";
import logger from "../config/logger";
import { IUserModel } from "../interface/IuserModel";
import { comparePassword, hashPassword } from "../utils/hashPassword";
import { SignupRequestDTO, SignupResponseDTO } from "../dtos/signup.dto";
import { IUserRepository } from "../interface/IUserRepository";
import { IAuthService } from "../interface/IAuthService";
import { SigninRequestDTO, SigninResponseDTO } from "../dtos/signin.dto";
import { TokenUserPayload } from "../types/TokenUserPayload";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { ITokenStore } from "../interface/IRedisHelper";
import { GetMeResponseDTO } from "../dtos/getMeResponse.dto";
import mongoose from "mongoose";

export class AuthService implements IAuthService {
    constructor(private userRepository: IUserRepository,private tokenStore:ITokenStore){}

    //for signup user

    signup=async (data:SignupRequestDTO): Promise<SignupResponseDTO>=>{ //used signup data transfer object 

        const {email,fullname,password,phone}=data

        logger.debug("Hitted on AuthService in Signup")

        const user=await this.userRepository.findUserByEmail(email);

        if(user){
            throw new AppError("User already exists", 400);
        }

        logger.debug("After user already exists check in Signup Authservice")

        const hashedPassword= await hashPassword(password)

        logger.debug(`Hashed password is ${hashedPassword}`)

        const newUser=await this.userRepository.createUser({
            email,
            fullname,
            password:hashedPassword,
            phone
        })

        return {
            id: newUser._id.toString(),
            email: newUser.email,
            fullname: newUser.fullname,
            phone: newUser.phone,
            isBlocked: newUser.isBlocked,
            isVerified:newUser.isVerified,
            createdAt:newUser.createdAt
        };
    }

    signin=async (data:SigninRequestDTO):Promise<SigninResponseDTO>=>{
        const {email,password}=data

        logger.debug("Hitted on authService in signin")

        const user=await this.userRepository.findUserByEmail(email)

        if(!user){
            throw new AppError(`Dont have an account using this email`,400)
        }

        const isPassword=await comparePassword(password,user.password)

        if(!isPassword){
            throw new AppError("Invalid password entered",400)
        }

        const payload:TokenUserPayload={
            user_Id:String(user._id),
            email:user.email
        }

        const accessToken=generateAccessToken(payload)
        const refreshToken=generateRefreshToken(payload)

        await this.tokenStore.setItem<string>(refreshToken,user._id.toString(), 7 * 24 * 60 * 60)

        return {
            userId:user._id.toString(),
            email:user.email,
            fullname:user.fullname,
            isBlocked:user.isBlocked,
            createdAt:user.createdAt,
            isVerified:user.isVerified,
            phone:user.phone,
            onboardingCompleted: user.onboardingCompleted || false,
            accessToken,
            refreshToken,
        }

    }
    getMe=async(data: string):Promise<GetMeResponseDTO> =>{

            if(!mongoose.Types.ObjectId.isValid(data)){
                throw new AppError("INVALID_USER",401)
            }

            const user=await this.userRepository.findUserById(data)

            if(!user){
                throw new AppError("USER_NOT_FOUND",404)
            }

            return {
                userId: user._id.toString(),
                email: user.email,
                fullname: user.fullname,
                phone: user.phone,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                isBlocked: user.isBlocked,
                onboardingCompleted: user.onboardingCompleted || false
            }
    }

    getAllUsers = async (limit: number = 20, offset: number = 0): Promise<IUserModel[]> => {
        try {
            return await this.userRepository.findAll(limit, offset);
        } catch (error) {
            throw new AppError("Failed to fetch users", 500);
        }
    }

    updateProfile = async (userId: string, data: { fullname?: string }): Promise<GetMeResponseDTO> => {
        try {
            const updatedUser = await this.userRepository.update(userId, data);
            if (!updatedUser) {
                throw new AppError("User not found", 404);
            }
            return {
                userId: updatedUser._id.toString(),
                email: updatedUser.email,
                fullname: updatedUser.fullname,
                phone: updatedUser.phone,
                isVerified: updatedUser.isVerified,
                createdAt: updatedUser.createdAt,
                isBlocked: updatedUser.isBlocked,
                onboardingCompleted: updatedUser.onboardingCompleted || false
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Failed to update profile", 550);
        }
    }
}