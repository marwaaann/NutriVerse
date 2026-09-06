import { API_URLS } from "../api/API_URLS";
import axiosInstance from "../api/axiosInstance";
import type { SignupFormType } from "../types/SignupFormType";
import axios from "axios";
import type { SignupResponse } from "../types/SignupResponseType";

export async function signup(data: SignupFormType):Promise<SignupResponse> {
  try {
    const response = await axiosInstance.post<SignupResponse>(API_URLS.SIGN_UP, data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || {
        success: false,
        message: "Server error",
      };
    }

    return { success: false, message: "Network error" };
  }
}

