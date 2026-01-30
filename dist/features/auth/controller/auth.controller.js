"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../service/auth.service");
const authService = new auth_service_1.AuthService();
exports.default = {
    register: async (req, res) => {
        try {
            const result = await authService.register(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },
    login: async (req, res) => {
        try {
            const result = await authService.login(req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(401).json({ message: error.message });
        }
    },
    refresh: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ message: 'Refresh token is required' });
            }
            const result = await authService.refreshTokens(refreshToken);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(401).json({ message: error.message });
        }
    }
};
