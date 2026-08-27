import z from "zod";

export const signinSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().nonempty("Must enter the password")
});