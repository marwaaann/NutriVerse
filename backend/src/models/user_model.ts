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
    onboardingCompleted:{
        type:Boolean,
        default:false
    }
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export const UserModel = mongoose.model<IUserModel>("User", userSchema);