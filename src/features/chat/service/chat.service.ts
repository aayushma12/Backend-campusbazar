import { ChatRepository } from '../repository/chat.repository';
import { ProductModel } from '../../product/entity/product.model';
import { ConversationModel } from '../entity/conversation.model';
import { ChatSenderRole, MessageModel } from '../entity/message.model';
import { TutorRequestModel } from '../../tutor/entity/tutorRequest.model';
import { UserModel } from '../../auth/entity/user.model';
import { NotificationService } from '../../notification/service/notification.service';

export class ChatService {
    private repository = new ChatRepository();
    private notificationService = new NotificationService();

    async getOrCreateConversation(buyerId: string, productId: string) {
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');

        const sellerId = product.ownerId.toString();
        if (buyerId === sellerId) throw new Error('Cannot start conversation with yourself');

        let conversation = await this.repository.findConversation(buyerId, sellerId, productId);

        if (!conversation) {
            conversation = await this._createConversationSafely({
                chatType: 'product',
                relatedEntityId: productId as any,
                participants: [buyerId as any, sellerId as any],
                contextType: 'product',
                buyerId: buyerId as any,
                sellerId: sellerId as any,
                productId: productId as any,
                unreadBy: []
            });
        }

        // Populate for normalization
        const populated = await ConversationModel.findById(conversation._id)
            .populate('buyerId', 'name profilePicture')
            .populate('sellerId', 'name profilePicture')
            .populate('productId', 'title price images');

        return this._normalizeConversation(populated!, buyerId);
    }

    async getOrCreateTutorConversation(tutorRequestId: string, userId: string) {
        const request = await TutorRequestModel.findById(tutorRequestId)
            .populate('studentId', 'name profilePicture')
            .populate('tutorId', 'name profilePicture');

        if (!request) throw new Error('Tutor request not found');
        if (request.status !== 'accepted' || !request.tutorId) {
            throw new Error('Chat is available only after tutor request acceptance');
        }

        const requesterId = request.studentId && (request.studentId as any)._id
            ? (request.studentId as any)._id.toString()
            : request.studentId.toString();
        const acceptedTutorId = request.tutorId && (request.tutorId as any)._id
            ? (request.tutorId as any)._id.toString()
            : request.tutorId.toString();

        if (userId !== requesterId && userId !== acceptedTutorId) {
            throw new Error('Unauthorized access to tutor request chat');
        }

        let conversation = await this.repository.findTutorConversationByRequestId(tutorRequestId);
        if (!conversation) {
            conversation = await this._createConversationSafely({
                chatType: 'tutor',
                relatedEntityId: tutorRequestId as any,
                participants: [requesterId as any, acceptedTutorId as any],
                contextType: 'tutor_request',
                tutorRequestId: tutorRequestId as any,
                buyerId: requesterId as any,
                sellerId: acceptedTutorId as any,
                unreadBy: []
            });
        }

        const populated = await ConversationModel.findById(conversation._id)
            .populate('buyerId', 'name profilePicture')
            .populate('sellerId', 'name profilePicture')
            .populate('tutorRequestId', 'subject topic preferredTime status studentId tutorId')
            .populate('productId', 'title price images');

        return this._normalizeConversation(populated!, userId);
    }

    async getMyConversations(userId: string) {
        const conversations = await this.repository.findUserConversations(userId);

        // Enrich with unread count and normalize participants for frontend
        const enriched = await Promise.all(conversations.map(async (conv) => {
            return this._normalizeConversation(conv, userId);
        }));

        return enriched;
    }

    private async _normalizeConversation(conv: any, userId: string) {
        const unreadCount = await MessageModel.countDocuments({
            conversationId: conv._id,
            senderId: { $ne: userId },
            read: false
        });

        const convObj = conv.toObject ? conv.toObject() : conv;

        // Map buyer and seller to participants array
        const participants = [];
        if (convObj.buyerId) {
            participants.push({
                id: convObj.buyerId._id || convObj.buyerId,
                name: convObj.buyerId.name || 'User',
                profilePicture: convObj.buyerId.profilePicture,
                role: this._getParticipantRole(convObj, (convObj.buyerId._id || convObj.buyerId).toString())
            });
        }
        if (convObj.sellerId) {
            participants.push({
                id: convObj.sellerId._id || convObj.sellerId,
                name: convObj.sellerId.name || 'User',
                profilePicture: convObj.sellerId.profilePicture,
                role: this._getParticipantRole(convObj, (convObj.sellerId._id || convObj.sellerId).toString())
            });
        }

        const chatType = this._resolveChatType(convObj);
        const relatedEntityId = convObj.relatedEntityId
            || (chatType === 'tutor' ? convObj.tutorRequestId?._id || convObj.tutorRequestId : convObj.productId?._id || convObj.productId);

        return {
            ...convObj,
            id: convObj._id,
            participants,
            unreadCount,
            chatType,
            relatedEntityId,
            contextType: convObj.contextType || 'product',
            tutorRequest: convObj.tutorRequestId
                ? {
                    id: convObj.tutorRequestId._id || convObj.tutorRequestId,
                    subject: convObj.tutorRequestId.subject,
                    topic: convObj.tutorRequestId.topic,
                    preferredTime: convObj.tutorRequestId.preferredTime,
                    status: convObj.tutorRequestId.status,
                }
                : undefined
        };
    }

    async getConversationById(id: string) {
        return this.repository.findConversationById(id);
    }

    async assertConversationAccess(conversationId: string, userId: string) {
        const conversation = await this.repository.findConversationById(conversationId);
        if (!conversation) throw new Error('Conversation not found');
        await this._assertConversationAccess(conversation, userId);
        return conversation;
    }

    async getMessages(userId: string, conversationId: string, page: number, limit: number) {
        const conversation = await this.repository.findConversationById(conversationId);
        if (!conversation) throw new Error('Conversation not found');

        await this._assertConversationAccess(conversation, userId);

        const skip = (page - 1) * limit;
        const messages = await this.repository.findMessages(conversationId, skip, limit);

        const populatedConversation = await ConversationModel.findById(conversationId)
            .populate('buyerId', 'name')
            .populate('sellerId', 'name');

        const buyerId = populatedConversation?.buyerId && (populatedConversation.buyerId as any)._id
            ? (populatedConversation.buyerId as any)._id.toString()
            : conversation.buyerId.toString();
        const sellerId = populatedConversation?.sellerId && (populatedConversation.sellerId as any)._id
            ? (populatedConversation.sellerId as any)._id.toString()
            : conversation.sellerId.toString();

        const buyerName = populatedConversation?.buyerId && (populatedConversation.buyerId as any).name
            ? (populatedConversation.buyerId as any).name
            : 'Student';
        const sellerName = populatedConversation?.sellerId && (populatedConversation.sellerId as any).name
            ? (populatedConversation.sellerId as any).name
            : 'Tutor';

        return messages.map((message) => {
            const messageObj = message.toObject ? message.toObject() : message;
            const senderId = messageObj.senderId?.toString?.() || messageObj.senderId;
            const senderRole = messageObj.senderRole || this._getParticipantRole(conversation, senderId);
            const senderName = messageObj.senderName
                || (senderId === buyerId ? buyerName : senderId === sellerId ? sellerName : 'Deleted User');

            return {
                ...messageObj,
                senderName,
                senderRole,
                chatType: messageObj.chatType || this._resolveChatType(conversation),
                timestamp: messageObj.timestamp || messageObj.createdAt,
            };
        });
    }

    async sendMessage(userId: string, conversationId: string, text: string) {
        const conversation = await this.repository.findConversationById(conversationId);
        if (!conversation) throw new Error('Conversation not found');

        await this._assertConversationAccess(conversation, userId);
        const sender = await this._resolveSenderIdentity(conversation, userId);
        const chatType = this._resolveChatType(conversation);

        const recipientId = conversation.buyerId.toString() === userId
            ? conversation.sellerId.toString()
            : conversation.buyerId.toString();

        const message = await this.repository.createMessage({
            conversationId: conversationId as any,
            senderId: userId as any,
            senderName: sender.senderName,
            senderRole: sender.senderRole,
            chatType,
            text,
            timestamp: new Date()
        });

        // Update unreadBy for recipient
        await ConversationModel.findByIdAndUpdate(conversationId, {
            $addToSet: { unreadBy: recipientId }
        });

        await this.notificationService.notifyNewMessage(recipientId, sender.senderName, conversationId);

        return message;
    }

    async markAsRead(userId: string, conversationId: string) {
        const conversation = await this.repository.findConversationById(conversationId);
        if (!conversation) throw new Error('Conversation not found');

        await this._assertConversationAccess(conversation, userId);

        await this.repository.markMessagesRead(conversationId, userId);
        return { success: true };
    }

    private async _assertConversationAccess(conversation: any, userId: string) {
        const isParticipant = conversation.buyerId.toString() === userId || conversation.sellerId.toString() === userId;
        if (!isParticipant) {
            throw new Error('Unauthorized access to conversation');
        }

        if (conversation.contextType === 'tutor_request' && conversation.tutorRequestId) {
            const request = await TutorRequestModel.findById(conversation.tutorRequestId);
            if (!request || request.status !== 'accepted' || !request.tutorId) {
                throw new Error('Tutor request chat is not available');
            }

            const studentId = request.studentId.toString();
            const tutorId = request.tutorId.toString();

            if (userId !== studentId && userId !== tutorId) {
                throw new Error('Unauthorized access to tutor request chat');
            }

            // Defensive integrity check in case conversation participants drift.
            const convBuyer = conversation.buyerId.toString();
            const convSeller = conversation.sellerId.toString();
            if (convBuyer !== studentId || convSeller !== tutorId) {
                throw new Error('Invalid tutor chat participants');
            }
        }
    }

    private _resolveChatType(conversation: any): 'product' | 'tutor' {
        if (conversation.chatType === 'tutor') return 'tutor';
        if (conversation.contextType === 'tutor_request') return 'tutor';
        return 'product';
    }

    private _getParticipantRole(conversation: any, participantId: string): ChatSenderRole {
        const buyerId = conversation.buyerId?._id ? conversation.buyerId._id.toString() : conversation.buyerId?.toString();
        const sellerId = conversation.sellerId?._id ? conversation.sellerId._id.toString() : conversation.sellerId?.toString();
        const chatType = this._resolveChatType(conversation);

        if (chatType === 'tutor') {
            if (participantId === buyerId) return 'student';
            if (participantId === sellerId) return 'tutor';
            return 'unknown';
        }

        if (participantId === buyerId) return 'buyer';
        if (participantId === sellerId) return 'seller';
        return 'unknown';
    }

    private async _resolveSenderIdentity(conversation: any, userId: string): Promise<{ senderName: string; senderRole: ChatSenderRole }> {
        const user = await UserModel.findById(userId).select('name role');
        if (user?.role === 'admin') {
            return {
                senderName: user.name || 'Admin',
                senderRole: 'admin'
            };
        }

        return {
            senderName: user?.name || 'Deleted User',
            senderRole: this._getParticipantRole(conversation, userId)
        };
    }

    private async _createConversationSafely(data: any) {
        try {
            return await this.repository.createConversation(data);
        } catch (error: any) {
            // Handle duplicate key race by reading the existing conversation.
            if (error?.code === 11000) {
                if (data.contextType === 'tutor_request' && data.tutorRequestId) {
                    const existing = await this.repository.findTutorConversationByRequestId(data.tutorRequestId.toString());
                    if (existing) return existing;
                }

                if (data.contextType === 'product' && data.productId) {
                    const existing = await this.repository.findConversation(
                        data.buyerId.toString(),
                        data.sellerId.toString(),
                        data.productId.toString()
                    );
                    if (existing) return existing;
                }
            }
            throw error;
        }
    }
}
