export interface SignupRequestDTO {
  fullname: string;
  email: string;
  password: string;
  phone: string;
}

export interface SignupResponseDTO {
  id: string;
  email: string;
  fullname: string;
  phone: string;
  isVerified: boolean;
  createdAt: Date;
  isBlocked:boolean;
  accessToken?: string;
  refreshToken?: string;
  onboardingCompleted?: boolean;
}