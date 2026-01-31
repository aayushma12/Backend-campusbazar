"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const user_repository_1 = require("../../auth/repository/user.repository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const cloudinary_helper_1 = require("../../../common/utils/cloudinary.helper");
class ProfileService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    /**
     * Get user profile with all details
     */
    async getProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            studentId: user.studentId,
            batch: user.batch,
            collegeId: user.collegeId,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    /**
     * Update user profile with optional image upload and password change
     */
    async updateProfile(userId, dto, profilePictureFile) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        // Prepare update object
        const updateData = {};
        // Update basic profile fields
        if (dto.name)
            updateData.name = dto.name;
        if (dto.phoneNumber)
            updateData.phoneNumber = dto.phoneNumber;
        if (dto.studentId)
            updateData.studentId = dto.studentId;
        if (dto.batch)
            updateData.batch = dto.batch;
        if (dto.collegeId)
            updateData.collegeId = dto.collegeId;
        // Handle profile picture upload
        if (profilePictureFile) {
            try {
                // Delete old profile picture if exists
                if (user.profilePicture) {
                    try {
                        const publicId = (0, cloudinary_helper_1.extractPublicId)(user.profilePicture);
                        await (0, cloudinary_helper_1.deleteFromCloudinary)(publicId);
                    }
                    catch (deleteError) {
                        console.error('Error deleting old profile picture:', deleteError);
                        // Continue even if deletion fails
                    }
                }
                // Upload new profile picture
                const uploadResult = await (0, cloudinary_helper_1.uploadToCloudinary)(profilePictureFile.buffer, 'campus-bazar/profiles');
                updateData.profilePicture = uploadResult.secure_url;
            }
            catch (uploadError) {
                throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
            }
        }
        // Handle password change
        if (dto.oldPassword && dto.newPassword) {
            // Verify old password
            const isOldPasswordValid = await bcrypt_1.default.compare(dto.oldPassword, user.password);
            if (!isOldPasswordValid) {
                throw new Error('Old password is incorrect');
            }
            // Hash new password
            const hashedNewPassword = await bcrypt_1.default.hash(dto.newPassword, 10);
            updateData.password = hashedNewPassword;
        }
        else if (dto.oldPassword || dto.newPassword) {
            // Both fields must be provided for password change
            throw new Error('Both oldPassword and newPassword are required to change password');
        }
        // Update user in database
        const updatedUser = await this.userRepository.update(userId, updateData);
        if (!updatedUser)
            throw new Error('Failed to update profile');
        return {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            studentId: updatedUser.studentId,
            batch: updatedUser.batch,
            collegeId: updatedUser.collegeId,
            profilePicture: updatedUser.profilePicture,
            message: dto.oldPassword && dto.newPassword
                ? 'Profile and password updated successfully'
                : 'Profile updated successfully',
        };
    }
    /**
     * Delete profile picture
     */
    async deleteProfilePicture(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        if (!user.profilePicture) {
            throw new Error('No profile picture to delete');
        }
        try {
            // Delete from Cloudinary
            const publicId = (0, cloudinary_helper_1.extractPublicId)(user.profilePicture);
            await (0, cloudinary_helper_1.deleteFromCloudinary)(publicId);
            // Update user in database
            const updatedUser = await this.userRepository.update(userId, { profilePicture: '' });
            return {
                message: 'Profile picture deleted successfully',
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    profilePicture: updatedUser.profilePicture,
                },
            };
        }
        catch (error) {
            throw new Error(`Failed to delete profile picture: ${error.message}`);
        }
    }
}
exports.ProfileService = ProfileService;
