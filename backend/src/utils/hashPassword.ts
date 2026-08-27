import bcrypt from "bcrypt";
import { ENV } from "../config/env";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = Number(ENV.SALT_ROUND) || 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};