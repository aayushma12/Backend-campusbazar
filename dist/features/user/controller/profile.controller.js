"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfilePicture = exports.updateProfile = exports.getProfile = void 0;
const profile_service_1 = require("../service/profile.service");
const profileService = new profile_service_1.ProfileService();
/**
 * Get user profile
 * GET /api/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await profileService.getProfile(userId);
        res.json({
            success: true,
            data: profile,
        });
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.getProfile = getProfile;
/**
 * Update user profile with optional image upload and password change
 * PATCH /api/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const dto = req.body;
        const profilePictureFile = req.file; // Multer file
        const updated = await profileService.updateProfile(userId, dto, profilePictureFile);
        res.json({
            success: true,
            data: updated,
        });
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.updateProfile = updateProfile;
/**
 * Delete profile picture
 * DELETE /api/profile/picture
 */
const deleteProfilePicture = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await profileService.deleteProfilePicture(userId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.deleteProfilePicture = deleteProfilePicture;
exports.default = { getProfile: exports.getProfile, updateProfile: exports.updateProfile, deleteProfilePicture: exports.deleteProfilePicture };
