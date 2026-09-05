declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    MONGO_URI: string;
    SALT_ROUND: string;
    ACCESS_TOKEN_SECRET:string;
    REFRESH_TOKEN_SECRET:string;
    ACCESS_TOKEN_EXPIRY:string;
    REFRESH_TOKEN_EXPIRY:string;
    FRONTEND_URL:string;
    NODE_ENV:string;
    GEMINI_API_KEY:string;
    FOOD_DATA_API_KEY:string;
  }
}