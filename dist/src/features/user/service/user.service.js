"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_repository_1 = require("../../auth/repository/user.repository");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    async getProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        return { id: user.id, name: user.name, email: user.email, collegeId: user.collegeId };
    }
    async updateProfile(userId, dto) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        const updated = await this.userRepository.update(userId, dto);
        if (!updated)
            throw new Error('Update failed');
        return { id: updated.id, name: updated.name, email: updated.email, collegeId: updated.collegeId };
    }
    async changePassword(userId, dto) {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        const valid = await bcrypt_1.default.compare(dto.oldPassword, user.password);
        if (!valid)
            throw new Error('Old password is incorrect');
        const hashed = await bcrypt_1.default.hash(dto.newPassword, 10);
        await this.userRepository.update(userId, { password: hashed });
        return { message: 'Password updated successfully' };
    }
}
exports.UserService = UserService;
