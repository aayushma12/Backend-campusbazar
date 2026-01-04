import { IUser } from '../../src/features/auth/entity/user.model';
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
