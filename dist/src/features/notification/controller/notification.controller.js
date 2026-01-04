"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const notification_service_1 = require("../service/notification.service");
const notificationService = new notification_service_1.NotificationService();
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { limit, offset, unread } = req.query;
        const notifications = await notificationService.getUserNotifications(userId, { limit: Number(limit), offset: Number(offset), unread });
        res.json(notifications);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const notification = await notificationService.markAsRead(id, userId);
        res.json(notification);
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const count = await notificationService.markAllAsRead(userId);
        res.json({ count });
    }
    catch (err) {
        next({ status: 400, message: err.message });
    }
};
exports.markAllAsRead = markAllAsRead;
exports.default = { getNotifications: exports.getNotifications, markAsRead: exports.markAsRead, markAllAsRead: exports.markAllAsRead };
