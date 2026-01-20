import { Router } from 'express';
import controller from '../controller/auth.controller';
import { validateBody } from '../middleware/validate-body.middleware';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';


//router
const router = Router();

router.post('/register', validateBody(RegisterDto), controller.register);
router.post('/login', validateBody(LoginDto), controller.login);

export default router;
