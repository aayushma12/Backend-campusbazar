import { Router } from 'express';
import controller from '../controller/auth.controller';
import resetController from '../controller/reset.controller';
import { validateBody } from '../middleware/validate-body.middleware';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { authGuard } from '../../../common/middleware/auth.guard';
import { adminGuard } from '../../../common/middleware/admin.guard';

const router = Router();

// Auth Routes
router.post('/register', validateBody(RegisterDto), controller.register);
router.post('/register/admin', validateBody(RegisterDto), (req, res, next) => { req.body.role = 'admin'; next(); }, controller.register);
router.post('/login', validateBody(LoginDto), controller.login);
router.post('/refresh', controller.refresh);

// Password reset
router.post('/forgot-password', resetController.forgotPassword);

// ✅ UPDATED: Added /:token to match the frontend call
router.post('/reset-password/:token', resetController.resetPassword);

// User Management (Admin only)
router.get('/users', authGuard, adminGuard, controller.getAllUsers);

// auth.routes.ts

// ... other imports
router.post('/forgot-password', resetController.forgotPassword);

// ✅ CHANGE THIS LINE: Add '/:token'
router.post('/reset-password/:token', resetController.resetPassword); 


export default router;