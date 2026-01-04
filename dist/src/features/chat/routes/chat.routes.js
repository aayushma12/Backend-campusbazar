"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_service_1 = require("../service/chat.service");
const auth_guard_1 = require("../../../common/middleware/auth.guard");
const router = (0, express_1.Router)();
const chatService = new chat_service_1.ChatService();
router.get('/:otherUserId', auth_guard_1.authGuard, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        const history = await chatService.getHistory(userId, otherUserId);
        res.json(history);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
});
exports.default = router;
