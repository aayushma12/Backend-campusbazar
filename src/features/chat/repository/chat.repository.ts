import { ConversationModel, IConversation } from '../entity/conversation.model';
import { MessageModel, IMessage } from '../entity/message.model';

export class ChatRepository {
    async findConversation(buyerId: string, sellerId: string, productId?: string): Promise<IConversation | null> {
        const query: any = {
            buyerId,
            sellerId,
            $or: [
                { chatType: 'product' },
                { chatType: { $exists: false }, contextType: 'product' }
            ]
        };

        if (productId) {
            query.$or = [
                { ...query.$or[0], relatedEntityId: productId },
                { ...query.$or[1], productId }
            ];
        }

        return ConversationModel.findOne(query);
    }

    async findTutorConversationByRequestId(requestId: string): Promise<IConversation | null> {
        return ConversationModel.findOne({
            $or: [
                { chatType: 'tutor', relatedEntityId: requestId },
                { chatType: { $exists: false }, contextType: 'tutor_request', tutorRequestId: requestId }
            ]
        });
    }

    async createConversation(data: Partial<IConversation>): Promise<IConversation> {
        return ConversationModel.create(data);
    }

    async findUserConversations(userId: string): Promise<IConversation[]> {
        return ConversationModel.find({
            $or: [{ buyerId: userId }, { sellerId: userId }]
        })
            .sort({ updatedAt: -1 })
            .populate('buyerId', 'name profilePicture')
            .populate('sellerId', 'name profilePicture')
            .populate('productId', 'title price images')
            .populate('tutorRequestId', 'subject topic preferredTime status studentId tutorId');
    }

    async findConversationById(id: string): Promise<IConversation | null> {
        return ConversationModel.findById(id);
    }

    async createMessage(data: Partial<IMessage>): Promise<IMessage> {
        const msg = await MessageModel.create(data);
        await ConversationModel.findByIdAndUpdate(data.conversationId, {
            lastMessage: data.text,
            lastSenderId: data.senderId,
            updatedAt: new Date()
        });
        return msg;
    }

    async findMessages(conversationId: string, skip: number, limit: number): Promise<IMessage[]> {
        return MessageModel.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }

    async markMessagesRead(conversationId: string, readerId: string): Promise<void> {
        await MessageModel.updateMany(
            { conversationId, senderId: { $ne: readerId }, read: false },
            { $set: { read: true } }
        );
        await ConversationModel.findByIdAndUpdate(conversationId, {
            $pull: { unreadBy: readerId }
        });
    }
}
