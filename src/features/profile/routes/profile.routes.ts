import { Router } from 'express';
import controller from '../controller/profile.controller';
import { validateBody } from '../../auth/middleware/validate-body.middleware';
import { UpdateProfileWithPasswordDto } from '../dto/update-profile-with-password.dto';
import { authGuard } from '../../../common/middleware/auth.guard';
import { upload } from '../../../common/middleware/multer.middleware';

import { trimBody } from '../../../common/middleware/trim-body.middleware';

const router = Router();

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private (requires authentication)
 */
router.get('/', authGuard, controller.getProfile);

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
router.patch(
    '/',
    authGuard,
    upload.single('profilePicture'), // Multer parses body here
    trimBody,                        // Clean up tabs/spaces after multer is done
    validateBody(UpdateProfileWithPasswordDto),
    controller.updateProfile
);

/**
 * @route   DELETE /api/profile/picture
 * @desc    Delete user profile picture
 * @access  Private (requires authentication)
 */
router.delete('/picture', authGuard, controller.deleteProfilePicture);

export default router;
