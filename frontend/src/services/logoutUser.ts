import axiosInstance from "../api/axiosInstance";
import { API_URLS } from "../api/API_URLS";

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axiosInstance.post(API_URLS.LOGOUT);
    return response.data;
  } catch (error) {
    console.error("Logout error", error);
    return { success: false, message: "Logout failed" };
  }
}
