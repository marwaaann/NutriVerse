export type SignupResponse = {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    phone:string;
    isBlocked:boolean;
    isDeleted:boolean;
    createdAt:Date;
    fullname?: string;
    onboardingCompleted?: boolean;
  };
};

export type SigninResponse = & SignupResponse

export type AuthUser = {
  userId: string;
  email: string;
  fullname: string;
  phone: string;
  isVerified: boolean;
  createdAt: Date;
  isBlocked: boolean;
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
};