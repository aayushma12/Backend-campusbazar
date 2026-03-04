
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    parentId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    id: string; // Virtual
}

const CategorySchema = new Schema<ICategory>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

CategorySchema.virtual('id').get(function (this: ICategory) {
    return this._id.toHexString();
});

export const CategoryModel = mongoose.model<ICategory>('Category', CategorySchema);
