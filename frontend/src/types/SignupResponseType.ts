export type SignupResponse = {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    phone:string;
    isBlocked:boolean;
    isDeleted:boolean;
    createdAt:Date
  };
};

export type SigninResponse = & SignupResponse