import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";

const SENSITIVE_FIELDS = new Set([
  "password",
  "confirmpassword",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "apikey",
  "secret",
  "gemini_api_key",
  "cloudinary_api_secret",
]);

const sanitizeData = (data: any): any => {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = "******";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const isAuthRoute = req.originalUrl.includes("/auth/signin") || req.originalUrl.includes("/auth/signup");
  
  if (isAuthRoute) {
    logger.info(`${req.method} ${req.originalUrl} | [AUTH PAYLOAD REDACTED]`);
  } else {
    const sanitizedBody = sanitizeData(req.body);
    logger.info(`${req.method} ${req.originalUrl} | body: ${JSON.stringify(sanitizedBody)}`);
  }
  next();
};

export default requestLogger