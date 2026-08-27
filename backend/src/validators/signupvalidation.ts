import { z } from "zod";

export const signupSchema = z.object({
  fullname: z.string().min(3, "Fullname is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 chars"),
  phone: z.string().min(10, "Invalid phone number"),
});