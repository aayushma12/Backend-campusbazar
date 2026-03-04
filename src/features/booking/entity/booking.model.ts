import mongoose, { Document, Schema, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'awaiting_payment' | 'paid' | 'cancelled' | 'completed';

export interface IBooking extends Document {
    studentId: Types.ObjectId;
    tutorId: Types.ObjectId;
    subject: string;
    description?: string;
    sessionType: 'online' | 'in-person';
    hours: number;
    ratePerHour: number;
    totalAmount: number;          // hours × ratePerHour
    netToTutor: number;           // after 10% platform commission
    platformFee: number;          // 10%
    status: BookingStatus;
    transactionId?: Types.ObjectId;
    conversationId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    description: { type: String },
    sessionType: { type: String, enum: ['online', 'in-person'], default: 'online' },
    hours: { type: Number, required: true, min: 0.5 },
    ratePerHour: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true },
    netToTutor: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'awaiting_payment', 'paid', 'cancelled', 'completed'],
        default: 'pending',
    },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);
