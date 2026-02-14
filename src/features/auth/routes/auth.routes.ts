import { Router } from 'express';
import controller from '../controller/auth.controller';
import { validateBody } from '../middleware/validate-body.middleware';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';


//router
const router = Router();

router.post('/register', validateBody(RegisterDto), controller.register);
router.post('/register/admin', validateBody(RegisterDto), (req, res, next) => { req.body.role = 'admin'; next(); }, controller.register);
router.post('/login', validateBody(LoginDto), controller.login);
router.post('/refresh', controller.refresh);

// User Management (Admin only)
import { authGuard } from '../../../common/middleware/auth.guard';
import { adminGuard } from '../../../common/middleware/admin.guard';
router.get('/users', authGuard, adminGuard, controller.getAllUsers);

export default router;
