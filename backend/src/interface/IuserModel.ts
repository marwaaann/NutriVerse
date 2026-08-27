import { Types } from "mongoose";
export interface IUserModel {
  _id: Types.ObjectId;
  email: string;
  password: string;
  phone: string;
  fullname: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  isBlocked:boolean;
  isDeleted:boolean;
}