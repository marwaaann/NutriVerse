import { z } from "zod";

export const signupSchema = z.object({
  fullname: z.string().min(1, "Full name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Invalid phone"),
  password: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});