"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repository/user.repository");
const crypto_1 = __importDefault(require("crypto"));
const email_helper_1 = require("../../../common/utils/email.helper");
const user_model_1 = require("../entity/user.model");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1d';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';
class AuthService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    async forgotPassword(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user)
            return;
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
        await user_model_1.UserModel.findByIdAndUpdate(user.id, {
            resetPasswordToken: token,
            resetPasswordExpires: tokenExpiry,
        });
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        await (0, email_helper_1.sendEmail)(user.email, 'Password Reset Request', `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`);
    }
    async resetPassword(token, newPassword) {
        const user = await user_model_1.UserModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            // Extra logging for debugging
            const tokenExists = await user_model_1.UserModel.findOne({ resetPasswordToken: token });
            if (!tokenExists) {
                console.error('Reset password failed: Token not found in database.', { token });
                throw new Error('Invalid or expired token');
            }
            if (tokenExists.resetPasswordExpires && tokenExists.resetPasswordExpires <= Date.now()) {
                console.error('Reset password failed: Token expired.', { token, expires: tokenExists.resetPasswordExpires });
                throw new Error('Token expired. Please request a new password reset.');
            }
            console.error('Reset password failed: Unknown reason.', { token });
            throw new Error('Invalid or expired token');
        }
        user.password = await bcrypt_1.default.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    }
    async register(dto) {
        const existing = await this.userRepository.findByEmail(dto.email);
        if (existing)
            throw new Error('Email already in use');
        const hashedPassword = await bcrypt_1.default.hash(dto.password, 10);
        const user = await this.userRepository.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: dto.role || 'user'
        });
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                studentId: user.studentId,
                batch: user.batch,
                collegeId: user.collegeId,
                profilePicture: user.profilePicture
            },
            accessToken,
            refreshToken,
            message: 'User registered successfully'
        };
    }
    async login(dto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user)
            throw new Error('Invalid credentials');
        const valid = await bcrypt_1.default.compare(dto.password, user.password);
        if (!valid)
            throw new Error('Invalid credentials');
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                studentId: user.studentId,
                batch: user.batch,
                collegeId: user.collegeId,
                profilePicture: user.profilePicture
            },
            accessToken,
            refreshToken
        };
    }
    generateAccessToken(userId, role) {
        return jsonwebtoken_1.default.sign({ id: userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
            const newAccessToken = this.generateAccessToken(payload.id);
            const newRefreshToken = this.generateRefreshToken(payload.id);
            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async getAllUsers() {
        const users = await this.userRepository.findAll();
        return users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            studentId: user.studentId,
            batch: user.batch,
            collegeId: user.collegeId,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt
        }));
    }
}
exports.AuthService = AuthService;
