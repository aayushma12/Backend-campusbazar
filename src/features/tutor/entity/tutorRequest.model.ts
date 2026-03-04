import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITutorRequest extends Document {
    studentId: Types.ObjectId;
    tutorId?: Types.ObjectId;
    subject: string;
    topic: string;
    description: string;
    preferredTime: string;
    status: 'pending' | 'accepted' | 'completed';
    createdAt: Date;
    updatedAt: Date;
    id: string;
}

const TutorRequestSchema = new Schema<ITutorRequest>({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, required: true },
    preferredTime: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'completed'],
        default: 'pending'
    },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

TutorRequestSchema.virtual('id').get(function (this: ITutorRequest) {
    return this._id.toHexString();
});

TutorRequestSchema.index({ studentId: 1 });
TutorRequestSchema.index({ tutorId: 1 });
TutorRequestSchema.index({ status: 1 });
TutorRequestSchema.index({ createdAt: -1 });

export const TutorRequestModel = mongoose.model<ITutorRequest>('TutorRequest', TutorRequestSchema);
