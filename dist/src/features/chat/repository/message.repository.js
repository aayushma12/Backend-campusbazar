"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const database_1 = require("../../../database/prisma/database");
class MessageRepository {
    async create(data) {
        return database_1.prisma.message.create({ data });
    }
    async findByRoom(room) {
        const [userA, userB] = room.split(':');
        return database_1.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userA, receiverId: userB },
                    { senderId: userB, receiverId: userA }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
    }
    async findBetweenUsers(userA, userB) {
        return database_1.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userA, receiverId: userB },
                    { senderId: userB, receiverId: userA }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
    }
}
exports.MessageRepository = MessageRepository;
