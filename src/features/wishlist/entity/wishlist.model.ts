
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
    createdAt: Date;
    id: string; // Virtual
}

const WishlistSchema = new Schema<IWishlist>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
WishlistSchema.index({ userId: 1 });

WishlistSchema.virtual('id').get(function (this: IWishlist) {
    return this._id.toHexString();
});

export const WishlistModel = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
