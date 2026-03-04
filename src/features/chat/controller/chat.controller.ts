import { Request, Response } from 'express';
import { ChatService } from '../service/chat.service';
import { getChatSocketServer } from '../socket/chat.gateway';

const chatService = new ChatService();

export const startConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' });

        const conversation = await chatService.getOrCreateConversation(userId, productId);
        res.status(200).json({ success: true, data: conversation });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const startTutorConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { requestId } = req.params;

        if (!requestId) {
            return res.status(400).json({ success: false, message: 'Tutor request ID required' });
        }

        const conversation = await chatService.getOrCreateTutorConversation(requestId, userId);
        res.status(200).json({ success: true, data: conversation });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const conversations = await chatService.getMyConversations(userId);
        res.status(200).json({ success: true, data: conversations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: conversationId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const messages = await chatService.getMessages(userId, conversationId, page, limit);
        res.status(200).json({ success: true, data: messages });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: conversationId } = req.params;
        const { text } = req.body;

        if (!text) return res.status(400).json({ success: false, message: 'Text message required' });

        const message = await chatService.sendMessage(userId, conversationId, text);

        const io = getChatSocketServer();
        if (io) {
            io.to(conversationId).emit('newMessage', message);

            const conversation = await chatService.getConversationById(conversationId);
            if (conversation) {
                const recipientId = conversation.buyerId.toString() === userId
                    ? conversation.sellerId.toString()
                    : conversation.buyerId.toString();

                io.to(recipientId).emit('newNotification', {
                    type: 'NEW_MESSAGE',
                    conversationId,
                    text,
                    senderName: (message as any).senderName,
                    senderRole: (message as any).senderRole,
                    chatType: (message as any).chatType,
                });
            }
        }

        res.status(201).json({ success: true, data: message });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const markRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: conversationId } = req.params;

        const result = await chatService.markAsRead(userId, conversationId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
