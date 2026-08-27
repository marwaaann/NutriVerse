import { UserDocument } from "../models/user_model";
import { Signup } from "../types/Signup";
import { IUserModel } from "./IuserModel";

export interface IUserRepository {

    findUserByEmail(data:string):Promise<IUserModel|null>;
    createUser(data:Signup):Promise<IUserModel>;
    findUserById(data:string):Promise<IUserModel|null>;

}