"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = __importDefault(require("../controller/profile.controller"));
const validate_body_middleware_1 = require("../../auth/middleware/validate-body.middleware");
const update_profile_with_password_dto_1 = require("../dto/update-profile-with-password.dto");
const auth_guard_1 = require("../../../common/middleware/auth.guard");
const multer_middleware_1 = require("../../../common/middleware/multer.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private (requires authentication)
 */
router.get('/', auth_guard_1.authGuard, profile_controller_1.default.getProfile);
/**
 * @route   PATCH /api/profile
 * @desc    Update user profile with optional image upload and password change
 * @access  Private (requires authentication)
 * @body    {
 *            name?: string,
 *            phoneNumber?: string,
 *            studentId?: string,
 *            batch?: string,
 *            collegeId?: string,
 *            oldPassword?: string,
 *            newPassword?: string
 *          }
 * @file    profilePicture - Image file (optional)
 */
router.patch('/', auth_guard_1.authGuard, multer_middleware_1.upload.single('profilePicture'), // Handle single file upload with field name 'profilePicture'
(0, validate_body_middleware_1.validateBody)(update_profile_with_password_dto_1.UpdateProfileWithPasswordDto), profile_controller_1.default.updateProfile);
/**
 * @route   DELETE /api/profile/picture
 * @desc    Delete user profile picture
 * @access  Private (requires authentication)
 */
router.delete('/picture', auth_guard_1.authGuard, profile_controller_1.default.deleteProfilePicture);
exports.default = router;
