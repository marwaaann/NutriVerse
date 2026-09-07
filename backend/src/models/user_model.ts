import mongoose, { Document, Schema,HydratedDocument  } from "mongoose";
import { IUserModel } from "../interface/IuserModel";


export type UserDocument = HydratedDocument<IUserModel>;

const userSchema = new Schema<IUserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    height: { type: Number },
    heightUnit: { type: String, default: "cm" },
    weight: { type: Number },
    weightUnit: { type: String, default: "kg" },
    age: { type: Number },
    gender: { type: String },
    activityLevel: { type: String },
    bmi: { type: Number },
    bmiCategory: { type: String },
    healthGoal: { type: String },
    dietaryPreference: { type: String },
    allergies: { type: [String], default: [] },
    foodPreferences: { type: [String], default: [] },
    preferredCuisines: { type: [String], default: [] },
    mealsPerDay: { type: Number, default: 3 },
    dailyCalorieTarget: { type: Number },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export const UserModel = mongoose.model<IUserModel>("User", userSchema);