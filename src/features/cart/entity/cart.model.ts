import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICartItem extends Document {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    id: string;
}

const CartItemSchema = new Schema<ICartItem>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

CartItemSchema.virtual('id').get(function (this: ICartItem) {
    return this._id.toHexString();
});

// One item per product per user
CartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const CartItemModel = mongoose.model<ICartItem>('CartItem', CartItemSchema);
