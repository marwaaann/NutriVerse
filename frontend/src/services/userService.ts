import axiosInstance from "../api/axiosInstance";
import { API_URLS } from "../api/API_URLS";

export interface UserResponse {
  userId: string;
  email: string;
  fullname: string;
  phone: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export const userService = {
  async getAllUsers(limit: number = 20, offset: number = 0): Promise<UserResponse[]> {
    const response = await axiosInstance.get(API_URLS.GET_USERS, {
      params: { limit, offset }
    });
    return response.data.data;
  },

  async updateProfile(fullname: string): Promise<UserResponse> {
    const response = await axiosInstance.put("/auth/profile", { fullname });
    return response.data.data;
  },

  async savePreferences(data: any): Promise<any> {
    const response = await axiosInstance.put("/api/mealplanner/preferences", data);
    return response.data.data;
  },

  async getPreferences(): Promise<any> {
    const response = await axiosInstance.get("/api/mealplanner/preferences");
    return response.data.data;
  },

  async addHouseholdMember(data: any): Promise<any> {
    const response = await axiosInstance.post("/api/mealplanner/household", data);
    return response.data.data;
  },

  async getHousehold(): Promise<any[]> {
    const response = await axiosInstance.get("/api/mealplanner/household");
    return response.data.data;
  },

  async deleteHouseholdMember(id: string): Promise<any> {
    const response = await axiosInstance.delete(`/api/mealplanner/household/${id}`);
    return response.data.data;
  }
};
