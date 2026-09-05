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