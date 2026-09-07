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
import { UserPreferencesModel } from "../models/userPreferences_model";
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

        const newUser=await this.userRepository.createUser({
            email,
            fullname,
            password:hashedPassword,
            phone
        });

        const payload: TokenUserPayload = {
            user_Id: String(newUser._id),
            email: newUser.email
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await this.tokenStore.setItem<string>(refreshToken, newUser._id.toString(), 7 * 24 * 60 * 60);

        return {
            id: newUser._id.toString(),
            email: newUser.email,
            fullname: newUser.fullname,
            phone: newUser.phone,
            isBlocked: newUser.isBlocked,
            isVerified:newUser.isVerified,
            createdAt:newUser.createdAt,
            onboardingCompleted: false,
            accessToken,
            refreshToken
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
                onboardingCompleted: user.onboardingCompleted || false,
                height: user.height,
                heightUnit: user.heightUnit,
                weight: user.weight,
                weightUnit: user.weightUnit,
                age: user.age,
                gender: user.gender,
                activityLevel: user.activityLevel,
                bmi: user.bmi,
                bmiCategory: user.bmiCategory,
                healthGoal: user.healthGoal,
                dietaryPreference: user.dietaryPreference,
                allergies: user.allergies,
                foodPreferences: user.foodPreferences,
                preferredCuisines: user.preferredCuisines,
                mealsPerDay: user.mealsPerDay,
                dailyCalorieTarget: user.dailyCalorieTarget
            }
    }

    getAllUsers = async (limit: number = 20, offset: number = 0): Promise<IUserModel[]> => {
        try {
            return await this.userRepository.findAll(limit, offset);
        } catch (error) {
            throw new AppError("Failed to fetch users", 500);
        }
    }

    updateProfile = async (userId: string, data: Partial<IUserModel>): Promise<GetMeResponseDTO> => {
        try {
            const existingUser = await this.userRepository.findUserById(userId);
            if (!existingUser) {
                throw new AppError("User not found", 404);
            }

            // Input validation
            if (data.height !== undefined && data.height <= 0) {
                throw new AppError("Height must be a positive number", 400);
            }
            if (data.weight !== undefined && data.weight <= 0) {
                throw new AppError("Weight must be a positive number", 400);
            }
            if (data.age !== undefined && data.age <= 0) {
                throw new AppError("Age must be a positive number", 400);
            }

            const updatedData: Partial<IUserModel> = { ...data };

            // Recalculate BMI automatically if height or weight is updated
            const height = data.height !== undefined ? data.height : existingUser.height;
            const weight = data.weight !== undefined ? data.weight : existingUser.weight;
            const heightUnit = data.heightUnit || existingUser.heightUnit || "cm";
            const weightUnit = data.weightUnit || existingUser.weightUnit || "kg";

            if (height && weight && height > 0 && weight > 0) {
                const hM = heightUnit === "ft/in" ? height * 0.0254 : height / 100;
                const wKg = weightUnit === "lbs" ? weight * 0.45359237 : weight;
                const calculatedBmi = Math.round((wKg / (hM * hM)) * 10) / 10;
                updatedData.bmi = calculatedBmi;

                if (calculatedBmi < 18.5) {
                    updatedData.bmiCategory = "Underweight";
                } else if (calculatedBmi < 25.0) {
                    updatedData.bmiCategory = "Normal Weight";
                } else if (calculatedBmi < 30.0) {
                    updatedData.bmiCategory = "Overweight";
                } else {
                    updatedData.bmiCategory = "Obese";
                }

                // Recalculate safe daily calorie target using Mifflin-St Jeor
                const age = data.age !== undefined ? data.age : (existingUser.age || 30);
                const gender = data.gender || existingUser.gender || "Other";
                let bmr = 10 * wKg + 6.25 * (hM * 100) - 5 * age;
                if (gender === "Male") bmr += 5;
                else if (gender === "Female") bmr -= 161;
                else bmr -= 78;

                const act = (data.activityLevel || existingUser.activityLevel || "Moderately Active").toLowerCase();
                let factor = 1.55;
                if (act.includes("sedentary")) factor = 1.2;
                else if (act.includes("light")) factor = 1.375;
                else if (act.includes("very")) factor = 1.725;
                else if (act.includes("extremely")) factor = 1.9;

                let tdee = Math.round(bmr * factor);
                const goal = (data.healthGoal || existingUser.healthGoal || "").toLowerCase();
                if (goal.includes("loss") || goal.includes("reduce") || updatedData.bmiCategory === "Overweight" || updatedData.bmiCategory === "Obese") {
                    tdee = Math.max(gender === "Female" ? 1250 : 1500, tdee - 400);
                } else if (goal.includes("gain") || updatedData.bmiCategory === "Underweight") {
                    tdee += 350;
                }
                updatedData.dailyCalorieTarget = tdee;
            }

            const updatedUser = await this.userRepository.update(userId, updatedData);
            if (!updatedUser) {
                throw new AppError("User not found", 404);
            }

            // Sync UserPreferencesModel
            try {
                const prefUpdates: any = {};
                if (data.dietaryPreference) prefUpdates.diet = data.dietaryPreference;
                if (data.allergies) prefUpdates.allergies = data.allergies;
                if (data.preferredCuisines) prefUpdates.cuisines = data.preferredCuisines;
                if (data.healthGoal) prefUpdates.healthGoals = [data.healthGoal];
                if (Object.keys(prefUpdates).length > 0) {
                    await UserPreferencesModel.findOneAndUpdate(
                        { userId },
                        { $set: prefUpdates },
                        { upsert: true }
                    );
                }
            } catch (prefErr) {
                logger.warn("Failed to sync preferences on profile update:", prefErr);
            }

            return {
                userId: updatedUser._id.toString(),
                email: updatedUser.email,
                fullname: updatedUser.fullname,
                phone: updatedUser.phone,
                isVerified: updatedUser.isVerified,
                createdAt: updatedUser.createdAt,
                isBlocked: updatedUser.isBlocked,
                onboardingCompleted: updatedUser.onboardingCompleted || false,
                height: updatedUser.height,
                heightUnit: updatedUser.heightUnit,
                weight: updatedUser.weight,
                weightUnit: updatedUser.weightUnit,
                age: updatedUser.age,
                gender: updatedUser.gender,
                activityLevel: updatedUser.activityLevel,
                bmi: updatedUser.bmi,
                bmiCategory: updatedUser.bmiCategory,
                healthGoal: updatedUser.healthGoal,
                dietaryPreference: updatedUser.dietaryPreference,
                allergies: updatedUser.allergies,
                foodPreferences: updatedUser.foodPreferences,
                preferredCuisines: updatedUser.preferredCuisines,
                mealsPerDay: updatedUser.mealsPerDay,
                dailyCalorieTarget: updatedUser.dailyCalorieTarget
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Failed to update profile", 500);
        }
    }
}