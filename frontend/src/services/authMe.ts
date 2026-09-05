import { API_URLS } from "../api/API_URLS";
import axiosInstance from "../api/axiosInstance";
import type { AuthUser } from "../types/SignupResponseType";


export async function getMe(): Promise<AuthUser> {
     const res = await axiosInstance.get(API_URLS.GET_ME);
    return res.data.data;
}