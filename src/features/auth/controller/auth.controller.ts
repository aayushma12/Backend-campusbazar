import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../service/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Register request body:', req.body);
    const dto: RegisterDto = req.body;
    const result = await authService.register(dto);
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Register error:', err);
    next({ status: 400, message: err.message });
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto: LoginDto = req.body;
    const result = await authService.login(dto);
    res.status(200).json(result);
  } catch (err: any) {
    next({ status: 400, message: err.message });
  }
};

export default { register, login };
