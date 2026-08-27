import axios from "axios";
import { API_URLS } from "../api/API_URLS";
import axiosInstance from "../api/axiosInstance";
import type { SigninResponse } from "../types/SignupResponseType";


export async function getMe():Promise<SigninResponse> {
     const res = await axiosInstance.get(API_URLS.GET_ME);
    return res.data.data;
}