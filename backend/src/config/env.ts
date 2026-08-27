export const ENV = {
  PORT: process.env.PORT!,
  MONGO_URI: process.env.MONGO_URI!,
  NODE_ENV: process.env.NODE_ENV!,
  SALT_ROUND:process.env.SALT_ROUND!,
  ACCESS_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET!,
  ACCESS_TOKEN_EXPIRY:process.env.ACCESS_TOKEN_EXPIRY as string,
  REFRESH_TOKEN_SECRET:process.env.REFRESH_TOKEN_SECRET!,
  REFRESH_TOKEN_EXPIRY:process.env.REFRESH_TOKEN_EXPIRY as string,
  FRONTEND_URL:process.env.FRONTEND_URL!,
};