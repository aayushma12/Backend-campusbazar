"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const auth_service_1 = require("../service/auth.service");
const authService = new auth_service_1.AuthService();
const register = async (req, res, next) => {
    try {
        console.log('Register request body:', req.body);
        const dto = req.body;
        const result = await authService.register(dto);
        res.status(201).json(result);
    }
    catch (err) {
        console.error('Register error:', err);
        next({ status: 400, message: err.message });
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const dto = req.body;
        const result = await authService.login(dto);
        res.status(200).json(result);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.login = login;
exports.default = { register: exports.register, login: exports.login };
