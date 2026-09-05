import logger from "../config/logger";
import { IUserModel } from "../interface/IuserModel";
import { IUserRepository } from "../interface/IUserRepository";
import { UserDocument, UserModel } from "../models/user_model";
import { Signup } from "../types/Signup";




export default class UserRepository implements IUserRepository{
    

    async findUserByEmail(email:string):Promise<IUserModel | null>{
        logger.debug("Hitted UserRepository in findUser")
        return await UserModel.findOne({email});
    }

    async createUser(data: Signup): Promise<IUserModel> {
        return await UserModel.create(data)
    }

    async findUserById(data: string): Promise<IUserModel | null> {

        return await UserModel.findById(data)
    }

    async findAll(limit: number = 20, offset: number = 0): Promise<IUserModel[]> {
        return await UserModel.find({})
            .skip(offset)
            .limit(limit)
            .select("-password"); // Never select or return passwords
    }

    async update(id: string, data: Partial<IUserModel>): Promise<IUserModel | null> {
        return await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    }
}