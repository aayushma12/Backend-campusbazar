"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_repository_1 = require("../repository/notification.repository");
// import { sendPushNotification } from '../../../common/utils/fcm';
class NotificationService {
    constructor() {
        this.notificationRepository = new notification_repository_1.NotificationRepository();
    }
    async createNotification(userId, title, body, type, data) {
        const notification = await this.notificationRepository.create({
            userId,
            title,
            body,
            type,
            data,
            isRead: false,
        });
        // Fetch user's FCM token (MongoDB)
        // If you want to send push notifications, implement FCM logic here
        // import { UserModel } from '../../auth/entity/user.model';
        // const user = await UserModel.findById(userId);
        // if (user?.fcmToken) {
        //   await sendPushNotification(user.fcmToken, title, body, data);
        // }
        return notification;
    }
    async getUserNotifications(userId, filters) {
        return this.notificationRepository.findByUser(userId, filters);
    }
    async markAsRead(id, userId) {
        return this.notificationRepository.markAsRead(id, userId);
    }
    async markAllAsRead(userId) {
        return this.notificationRepository.markAllAsRead(userId);
    }
}
exports.NotificationService = NotificationService;
