"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const mongoose_1 = require("./database/mongoose");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const chat_socket_1 = require("./features/chat/socket/chat.socket");
const chat_gateway_1 = require("./features/chat/socket/chat.gateway");
const PORT = process.env.PORT || 4000;
async function bootstrap() {
    try {
        await (0, mongoose_1.connectDB)();
        console.log('MongoDB connected');
        const httpServer = (0, http_1.createServer)(app_1.default);
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: true,
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });
        (0, chat_gateway_1.setChatSocketServer)(io);
        (0, chat_socket_1.setupChatSocket)(io);
        httpServer.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Server bootstrap error:', err);
        process.exit(1);
    }
}
bootstrap();
