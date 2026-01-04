"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const message_repository_1 = require("../repository/message.repository");
class ChatService {
    constructor() {
        this.messageRepository = new message_repository_1.MessageRepository();
    }
    async sendMessage(senderId, dto) {
        return this.messageRepository.create({
            senderId,
            receiverId: dto.receiverId,
            text: dto.text,
        });
    }
    async getHistory(userA, userB) {
        return this.messageRepository.findBetweenUsers(userA, userB);
    }
}
exports.ChatService = ChatService;
