import { Server as SocketServer } from 'socket.io';
import { ChatService } from '../service/chat.service';
import jwt from 'jsonwebtoken';

const chatService = new ChatService();

export const setupChatSocket = (io: SocketServer) => {
    // Middleware for Authentication
    io.use((socket: any, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded: any = jwt.verify(token.replace('Bearer ', ''), process.env.ACCESS_TOKEN_SECRET!);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: any) => {
        const userId = socket.user.id;
        console.log('User connected to socket:', userId);

        // Join a private room for this user to receive global notifications
        socket.join(userId);

        socket.on('joinConversation', async (conversationId: string) => {
            // Security: Check if user is participant
            try {
                await chatService.assertConversationAccess(conversationId, userId);
                socket.join(conversationId);
                console.log(`User ${userId} joined room ${conversationId}`);
            } catch (e) { }
        });

        socket.on('sendMessage', async (data: { conversationId: string, text: string }) => {
            try {
                const message = await chatService.sendMessage(userId, data.conversationId, data.text);

                // 1. Send to the conversation room (both sides see it)
                io.to(data.conversationId).emit('newMessage', message);

                // 2. Also send a notification to the recipient of this message
                // We get the conversation to identify the other person
                const conversation = await chatService.assertConversationAccess(data.conversationId, userId);
                if (conversation) {
                    const recipientId = conversation.buyerId.toString() === userId
                        ? conversation.sellerId.toString()
                        : conversation.buyerId.toString();

                    io.to(recipientId).emit('newNotification', {
                        type: 'NEW_MESSAGE',
                        conversationId: data.conversationId,
                        text: data.text,
                        senderName: (message as any).senderName,
                        senderRole: (message as any).senderRole,
                        chatType: (message as any).chatType,
                    });
                }
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('typing', (data: { conversationId: string, isTyping: boolean }) => {
            socket.to(data.conversationId).emit('typing', {
                conversationId: data.conversationId,
                userId: userId,
                isTyping: data.isTyping
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected from socket:', userId);
        });
    });
};
