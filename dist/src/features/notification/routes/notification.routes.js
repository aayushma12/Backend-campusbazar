"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = __importDefault(require("../controller/notification.controller"));
const auth_guard_1 = require("../../../common/middleware/auth.guard");
const validate_body_middleware_1 = require("../../auth/middleware/validate-body.middleware");
const mark_as_read_dto_1 = require("../dto/mark-as-read.dto");
const router = (0, express_1.Router)();
router.get('/', auth_guard_1.authGuard, notification_controller_1.default.getNotifications);
router.patch('/:id/read', auth_guard_1.authGuard, (0, validate_body_middleware_1.validateBody)(mark_as_read_dto_1.MarkAsReadDto), notification_controller_1.default.markAsRead);
router.patch('/read-all', auth_guard_1.authGuard, notification_controller_1.default.markAllAsRead);
exports.default = router;
