import axios from "axios";
import { API_URLS } from "../api/API_URLS";
import axiosInstance from "../api/axiosInstance";
import type { SigninFormType } from "../types/SigninFormType";
import type { SigninResponse } from "../types/SignupResponseType";



export async function signin(data:SigninFormType):Promise<SigninResponse> {
    try {
        const response=await axiosInstance.post(API_URLS.SIGN_IN,data);
        return response.data
    } catch (error:unknown) {
        if (axios.isAxiosError(error)) {
      return error.response?.data || {
        success: false,
        message: "Server error",
      };
    }

    return { success: false, message: "Network error" };
    }
}