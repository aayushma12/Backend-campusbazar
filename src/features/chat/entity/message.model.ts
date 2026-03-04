import mongoose, { Schema, Document, Types } from 'mongoose';

export type ChatSenderRole = 'tutor' | 'student' | 'seller' | 'buyer' | 'admin' | 'unknown';

export interface IMessage extends Document {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    senderName: string;
    senderRole: ChatSenderRole;
    chatType: 'product' | 'tutor';
    text: string;
    read: boolean; // Simple read for two-party conversations
    timestamp: Date;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true, trim: true },
    senderRole: {
        type: String,
        enum: ['tutor', 'student', 'seller', 'buyer', 'admin', 'unknown'],
        required: true,
        default: 'unknown'
    },
    chatType: { type: String, enum: ['product', 'tutor'], required: true, default: 'product' },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
