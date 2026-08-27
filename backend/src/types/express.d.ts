import { TokenUserPayload } from "../types/TokenUserPayload";

declare global {
  namespace Express {
    interface Request {
      user?: TokenUserPayload;
    }
  }
}