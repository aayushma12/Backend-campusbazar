"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controller/auth.controller"));
const validate_body_middleware_1 = require("../middleware/validate-body.middleware");
const register_dto_1 = require("../dto/register.dto");
const login_dto_1 = require("../dto/login.dto");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_body_middleware_1.validateBody)(register_dto_1.RegisterDto), auth_controller_1.default.register);
router.post('/login', (0, validate_body_middleware_1.validateBody)(login_dto_1.LoginDto), auth_controller_1.default.login);
exports.default = router;
