import axiosInstance from "../api/axiosInstance";
import { API_URLS } from "../api/API_URLS";

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  try {
    localStorage.removeItem("nutriverse_ai_chat_history");
    const response = await axiosInstance.post(API_URLS.LOGOUT);
    return response.data;
  } catch (error) {
    localStorage.removeItem("nutriverse_ai_chat_history");
    console.error("Logout error", error);
    return { success: false, message: "Logout failed" };
  }
}
