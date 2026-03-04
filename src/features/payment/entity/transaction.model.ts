
import mongoose, { Document, Schema, Types } from 'mongoose';

export type TransactionStatus = 'pending' | 'done' | 'failed' | 'cancelled';

export interface ITransaction extends Document {
    productId?: Types.ObjectId; // Kept for legacy compatibility
    productIds: Types.ObjectId[]; // New: support for multiple products in one payment
    buyerId: Types.ObjectId;
    sellerId: Types.ObjectId; // If multiple sellers, this might be null or platform ID. For now, assume single seller or platform.
    amount: number;
    status: TransactionStatus;
    transactionUUID: string;
    items?: {
        productId: Types.ObjectId;
        quantity: number;
        unitPrice: number;
    }[];
    transactionCode?: string;
    paidTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Simplified: primary seller or system
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'done', 'failed', 'cancelled'],
        default: 'pending'
    },
    transactionUUID: { type: String, required: true, unique: true },
    items: [
        {
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, min: 1 },
            unitPrice: { type: Number, required: true, min: 0 },
        }
    ],
    transactionCode: { type: String },
    paidTime: { type: Date },
}, { timestamps: true });

export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);
