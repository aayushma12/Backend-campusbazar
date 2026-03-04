import mongoose, { Schema, Document, Types } from 'mongoose';

export enum ReportType {
    PRODUCT = 'product',
    USER = 'user',
    CHAT = 'chat',
    MESSAGE = 'message'
}

export enum ReportStatus {
    PENDING = 'pending',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
    IGNORED = 'ignored',
    REMOVED = 'removed',
    WARNED = 'warned'
}

export interface IReport extends Document {
    reporterId: Types.ObjectId;
    targetId: Types.ObjectId; // ID of the product, user, or chat being reported
    targetType: ReportType;
    reason: string;
    details?: string;
    status: ReportStatus;
    resolutionNotes?: string;
    resolvedById?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    id: string;
}

const ReportSchema = new Schema<IReport>({
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetType: {
        type: String,
        enum: Object.values(ReportType),
        required: true
    },
    reason: { type: String, required: true },
    details: { type: String },
    status: {
        type: String,
        enum: Object.values(ReportStatus),
        default: ReportStatus.PENDING
    },
    resolutionNotes: { type: String },
    resolvedById: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

ReportSchema.virtual('id').get(function (this: IReport) {
    return this._id.toHexString();
});

ReportSchema.index({ targetType: 1, status: 1 });
ReportSchema.index({ reporterId: 1 });

export const ReportModel = mongoose.model<IReport>('Report', ReportSchema);
