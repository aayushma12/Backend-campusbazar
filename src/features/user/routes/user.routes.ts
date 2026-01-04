import { Router } from 'express';
import controller from '../controller/user.controller';
import { validateBody } from '../../auth/middleware/validate-body.middleware';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { authGuard } from '../../../common/middleware/auth.guard';

const router = Router();

router.get('/profile', authGuard, controller.getProfile);
router.patch('/profile', authGuard, validateBody(UpdateProfileDto), controller.updateProfile);
router.patch('/password', authGuard, validateBody(ChangePasswordDto), controller.changePassword);

export default router;
