"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controller/auth.controller"));
const reset_controller_1 = __importDefault(require("../controller/reset.controller"));
const validate_body_middleware_1 = require("../middleware/validate-body.middleware");
const register_dto_1 = require("../dto/register.dto");
const login_dto_1 = require("../dto/login.dto");
const auth_guard_1 = require("../../../common/middleware/auth.guard");
const admin_guard_1 = require("../../../common/middleware/admin.guard");
const router = (0, express_1.Router)();
// Auth Routes
router.post('/register', (0, validate_body_middleware_1.validateBody)(register_dto_1.RegisterDto), auth_controller_1.default.register);
router.post('/register/admin', (0, validate_body_middleware_1.validateBody)(register_dto_1.RegisterDto), (req, res, next) => { req.body.role = 'admin'; next(); }, auth_controller_1.default.register);
router.post('/login', (0, validate_body_middleware_1.validateBody)(login_dto_1.LoginDto), auth_controller_1.default.login);
router.post('/refresh', auth_controller_1.default.refresh);
// Password reset
router.post('/forgot-password', reset_controller_1.default.forgotPassword);
// ✅ UPDATED: Added /:token to match the frontend call
router.post('/reset-password/:token', reset_controller_1.default.resetPassword);
// User Management (Admin only)
router.get('/users', auth_guard_1.authGuard, admin_guard_1.adminGuard, auth_controller_1.default.getAllUsers);
exports.default = router;
