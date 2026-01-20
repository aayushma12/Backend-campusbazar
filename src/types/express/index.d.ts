import { User } from "../../features/auth/entity/user.entity";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};