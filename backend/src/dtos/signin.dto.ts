export interface SigninRequestDTO {
  email: string;
  password: string;
}

export interface SigninResponseDTO {
  userId: string;
  email: string;
  fullname: string;
  phone: string;
  isVerified: boolean;
  createdAt: Date;
  isBlocked:boolean;
  onboardingCompleted:boolean;
  refreshToken:string;
  accessToken:string;
}