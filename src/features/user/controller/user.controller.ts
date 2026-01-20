import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../common/middleware/auth.guard';
import { UserService } from '../service/user.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

const userService = new UserService();

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const profile = await userService.getProfile(userId);
    res.json(profile);
  } catch (err: any) {
    next({ status: 400, message: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const dto: UpdateProfileDto = req.body;
    const updated = await userService.updateProfile(userId, dto);
    res.json(updated);
  } catch (err: any) {
    next({ status: 400, message: err.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const dto: ChangePasswordDto = req.body;
    const result = await userService.changePassword(userId, dto);
    res.json(result);
  } catch (err: any) {
    next({ status: 400, message: err.message });
  }
};

export default { getProfile, updateProfile, changePassword };
