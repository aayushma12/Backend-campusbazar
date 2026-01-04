"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
const user_service_1 = require("../service/user.service");
const userService = new user_service_1.UserService();
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await userService.getProfile(userId);
        res.json(profile);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const dto = req.body;
        const updated = await userService.updateProfile(userId, dto);
        res.json(updated);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const dto = req.body;
        const result = await userService.changePassword(userId, dto);
        res.json(result);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.changePassword = changePassword;
exports.default = { getProfile: exports.getProfile, updateProfile: exports.updateProfile, changePassword: exports.changePassword };
