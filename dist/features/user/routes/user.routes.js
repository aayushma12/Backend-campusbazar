"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controller/user.controller"));
const validate_body_middleware_1 = require("../../auth/middleware/validate-body.middleware");
const update_profile_dto_1 = require("../dto/update-profile.dto");
const change_password_dto_1 = require("../dto/change-password.dto");
const auth_guard_1 = require("../../../common/middleware/auth.guard");
const router = (0, express_1.Router)();
router.get('/profile', auth_guard_1.authGuard, user_controller_1.default.getProfile);
router.patch('/profile', auth_guard_1.authGuard, (0, validate_body_middleware_1.validateBody)(update_profile_dto_1.UpdateProfileDto), user_controller_1.default.updateProfile);
router.patch('/password', auth_guard_1.authGuard, (0, validate_body_middleware_1.validateBody)(change_password_dto_1.ChangePasswordDto), user_controller_1.default.changePassword);
exports.default = router;
