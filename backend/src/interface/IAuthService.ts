import { GetMeResponseDTO } from "../dtos/getMeResponse.dto";
import { SigninRequestDTO, SigninResponseDTO } from "../dtos/signin.dto";
import { SignupRequestDTO } from "../dtos/signup.dto";
import { SignupResponseDTO } from "../dtos/signup.dto";
import { TokenUserPayload } from "../types/TokenUserPayload";

import { IUserModel } from "./IuserModel";

export interface IAuthService {
  signup(data: SignupRequestDTO): Promise<SignupResponseDTO>;
  signin(data: SigninRequestDTO):Promise<SigninResponseDTO>;
  getMe(data:string):Promise<GetMeResponseDTO>;
  getAllUsers(limit?: number, offset?: number): Promise<IUserModel[]>;
  updateProfile(userId: string, data: { fullname?: string }): Promise<GetMeResponseDTO>;
}