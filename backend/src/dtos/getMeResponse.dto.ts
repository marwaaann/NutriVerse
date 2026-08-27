export interface GetMeResponseDTO {
  userId: string;
  email: string;
  fullname: string;
  phone: string;
  isVerified: boolean;
  createdAt: Date;
  isBlocked: boolean;
}