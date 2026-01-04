"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repository/user.repository");
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return { user: { id: user.id, name: user.name, email: user.email }, token };
    }
    async login(dto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user)
            throw new Error('Invalid credentials');
        const valid = await bcrypt_1.default.compare(dto.password, user.password);
        if (!valid)
            throw new Error('Invalid credentials');
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return { user: { id: user.id, name: user.name, email: user.email }, token };
    }
}
exports.AuthService = AuthService;
