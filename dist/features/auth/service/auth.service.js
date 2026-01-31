"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repository/user.repository");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
class AuthService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
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
        });
        return {
            user: { id: user.id, name: user.name, email: user.email },
            message: 'User registered successfully. Please login to continue.'
        };
    }
    async login(dto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user)
            throw new Error('Invalid credentials');
        const valid = await bcrypt_1.default.compare(dto.password, user.password);
        if (!valid)
            throw new Error('Invalid credentials');
        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = this.generateRefreshToken(user.id);
        return {
            user: { id: user.id, name: user.name, email: user.email },
            accessToken,
            refreshToken
        };
    }
    generateAccessToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
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
}
exports.AuthService = AuthService;
