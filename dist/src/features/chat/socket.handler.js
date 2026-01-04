"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chat_service_1 = require("./service/chat.service");
const chatService = new chat_service_1.ChatService();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
function setupSocket(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token)
            return next(new Error('Authentication required'));
        try {
            const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // @ts-ignore
            socket.data.user = payload.userId;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.user;
        socket.on('join-room', (otherUserId) => {
            const room = [userId, otherUserId].sort().join(':');
            socket.join(room);
        });
        socket.on('send-message', async (data) => {
            const room = [userId, data.receiverId].sort().join(':');
            const message = await chatService.sendMessage(userId, data);
            io.to(room).emit('receive-message', message);
        });
    });
}
