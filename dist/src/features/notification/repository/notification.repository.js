"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const database_1 = require("../../../database/prisma/database");
class NotificationRepository {
    async create(data) {
        return database_1.prisma.notification.create({ data });
    }
    async findByUser(userId, filters) {
        const { limit = 20, offset = 0, unread } = filters;
        return database_1.prisma.notification.findMany({
            where: {
                userId,
                ...(unread !== undefined ? { isRead: !unread ? undefined : false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
        });
    }
    async markAsRead(id, userId) {
        return database_1.prisma.notification.update({
            where: { id, userId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        const { count } = await database_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return count;
    }
}
exports.NotificationRepository = NotificationRepository;
