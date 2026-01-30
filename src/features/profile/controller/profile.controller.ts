import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../common/middleware/auth.guard';
import { ProfileService } from '../service/profile.service';
import { UpdateProfileWithPasswordDto } from '../dto/update-profile-with-password.dto';

const profileService = new ProfileService();

/**
 * Get user profile
 * GET /api/profile
 */
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const profile = await profileService.getProfile(userId);
        res.json({
            success: true,
            data: profile,
        });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};

/**
 * Update user profile with optional image upload and password change
 * PATCH /api/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const dto: UpdateProfileWithPasswordDto = req.body;
        const profilePictureFile = req.file; // Multer file

        const updated = await profileService.updateProfile(userId, dto, profilePictureFile);

        res.json({
            success: true,
            data: updated,
        });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};

/**
 * Delete profile picture
 * DELETE /api/profile/picture
 */
export const deleteProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const result = await profileService.deleteProfilePicture(userId);

        res.json({
            success: true,
            data: result,
        });
    } catch (err: any) {
        next({ status: 400, message: err.message });
    }
};

export default { getProfile, updateProfile, deleteProfilePicture };
