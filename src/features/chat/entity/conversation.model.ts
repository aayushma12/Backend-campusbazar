import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
    chatType: 'product' | 'tutor';
    relatedEntityId?: Types.ObjectId;
    participants: Types.ObjectId[];
    contextType: 'product' | 'tutor_request';
    productId?: Types.ObjectId;
    tutorRequestId?: Types.ObjectId;
    buyerId: Types.ObjectId;
    sellerId: Types.ObjectId;
    lastMessage?: string;
    lastSenderId?: Types.ObjectId;
    unreadCount: number; // For the current user view, we might need a more complex structure if it's per user
    // Simpler unread structure:
    unreadBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
    chatType: { type: String, enum: ['product', 'tutor'], default: 'product', required: true },
    relatedEntityId: { type: Schema.Types.ObjectId },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    contextType: { type: String, enum: ['product', 'tutor_request'], default: 'product', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    tutorRequestId: { type: Schema.Types.ObjectId, ref: 'TutorRequest' },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: String },
    lastSenderId: { type: Schema.Types.ObjectId, ref: 'User' },
    unreadBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

ConversationSchema.index(
    { chatType: 1, buyerId: 1, sellerId: 1, relatedEntityId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            chatType: 'product',
            relatedEntityId: { $exists: true }
        }
    }
);

ConversationSchema.index(
    { chatType: 1, relatedEntityId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            chatType: 'tutor',
            relatedEntityId: { $exists: true }
        }
    }
);

ConversationSchema.index(
    { contextType: 1, buyerId: 1, sellerId: 1, productId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            contextType: 'product',
            productId: { $exists: true }
        }
    }
);

ConversationSchema.index(
    { contextType: 1, tutorRequestId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            contextType: 'tutor_request',
            tutorRequestId: { $exists: true }
        }
    }
);

ConversationSchema.index({ buyerId: 1, sellerId: 1, updatedAt: -1 });
ConversationSchema.index({ sellerId: 1, buyerId: 1, updatedAt: -1 });
ConversationSchema.index({ participants: 1, updatedAt: -1 });

export const ConversationModel = mongoose.model<IConversation>('Conversation', ConversationSchema);
