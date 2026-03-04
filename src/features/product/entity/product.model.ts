
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
    title: string;
    description: string;
    price: number;
    negotiable: boolean;
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    categoryId: Types.ObjectId;
    campus: string;
    images: string[];
    status: 'available' | 'reserved' | 'sold' | 'deleted';
    ownerId: Types.ObjectId;
    views: number;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    id: string;
}

const ProductSchema = new Schema<IProduct>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    negotiable: { type: Boolean, default: false },
    condition: {
        type: String,
        enum: ['new', 'like_new', 'good', 'fair', 'poor'],
        required: true
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    campus: { type: String, required: true },
    images: {
        type: [String],
        validate: [(val: string[]) => val.length >= 1 && val.length <= 8, '{PATH} must have at least 1 and at most 8 images']
    },
    status: {
        type: String,
        enum: ['available', 'reserved', 'sold', 'deleted'],
        default: 'available'
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

ProductSchema.virtual('id').get(function (this: IProduct) {
    return this._id.toHexString();
});

// Indexes for search and optimization
ProductSchema.index({ title: 'text', description: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ campus: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
