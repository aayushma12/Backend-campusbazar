import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'new_message'
  | 'new_order'
  | 'order_status_changed'
  | 'new_product_uploaded'
  | 'product_updated'
  | 'product_deleted'
  | 'product_sold'
  | 'order_completed'
  | 'admin_activity'
  | 'tutor_request_accepted'
  | 'system';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  id: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'new_message',
        'new_order',
        'order_status_changed',
        'new_product_uploaded',
        'product_updated',
        'product_deleted',
        'product_sold',
        'order_completed',
        'admin_activity',
        'tutor_request_accepted',
        'system',
      ],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

NotificationSchema.virtual('id').get(function (this: INotification) {
  return this._id.toHexString();
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
