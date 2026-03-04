import mongoose, { Schema, Document, Types } from 'mongoose';

export enum OrderStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    RESERVED = 'reserved',
    HANDED_OVER = 'handed_over',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DISPUTED = 'disputed'
}

export interface IOrder extends Document {
    productId: Types.ObjectId;
    buyerId: Types.ObjectId;
    sellerId: Types.ObjectId;
    price: number;
    quantity: number;
    paymentMethod: 'COD' | 'eSewa';
    paymentStatus: 'Pending' | 'Paid' | 'Failed';
    status: OrderStatus;
    completedAt?: Date;
    statusHistory: {
        status: OrderStatus;
        changedBy?: Types.ObjectId;
        changedAt: Date;
        note?: string;
        metadata?: Record<string, unknown>;
    }[];
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
    id: string;
}

const OrderSchema = new Schema<IOrder>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    paymentMethod: {
        type: String,
        enum: ['COD', 'eSewa'],
        default: 'COD'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING
    },
    completedAt: { type: Date },
    statusHistory: {
        type: [
            {
                status: {
                    type: String,
                    enum: Object.values(OrderStatus),
                    required: true,
                },
                changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                changedAt: { type: Date, default: Date.now, required: true },
                note: { type: String },
                metadata: { type: Schema.Types.Mixed },
            }
        ],
        default: [],
    },
    rejectionReason: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

OrderSchema.virtual('id').get(function (this: IOrder) {
    return this._id.toHexString();
});

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ productId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ sellerId: 1, status: 1, updatedAt: -1 });
OrderSchema.index({ completedAt: -1 });

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
