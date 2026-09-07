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
  onboardingCompleted?: boolean;
  height?: number;
  heightUnit?: "cm" | "ft/in";
  weight?: number;
  weightUnit?: "kg" | "lbs";
  age?: number;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say";
  activityLevel?: "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Extremely Active";
  bmi?: number;
  bmiCategory?: "Underweight" | "Normal Weight" | "Overweight" | "Obese";
  healthGoal?: string;
  dietaryPreference?: string;
  allergies?: string[];
  foodPreferences?: string[];
  preferredCuisines?: string[];
  mealsPerDay?: number;
  dailyCalorieTarget?: number;
}

export const userService = {
  async getAllUsers(limit: number = 20, offset: number = 0): Promise<UserResponse[]> {
    const response = await axiosInstance.get(API_URLS.GET_USERS, {
      params: { limit, offset }
    });
    return response.data.data;
  },

  async updateProfile(data: Partial<UserResponse> | string): Promise<UserResponse> {
    const payload = typeof data === "string" ? { fullname: data } : data;
    const response = await axiosInstance.put("/auth/profile", payload);
    return response.data.data;
  },

  async completeOnboarding(data: any): Promise<any> {
    const response = await axiosInstance.post("/api/mealplanner/onboarding", data);
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
