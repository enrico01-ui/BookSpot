import { JwtPayload } from "jsonwebtoken";

export interface AuthPayload {
  sub: number;
  role: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload | JwtPayload;
        }
    }
}