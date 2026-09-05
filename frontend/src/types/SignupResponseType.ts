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
  onboardingCompleted: boolean;
};