import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWallet extends Document {
    userId: Types.ObjectId;
    balance: number;          // Total available balance (NPR)
    pendingBalance: number;   // Earnings not yet confirmed
    totalEarned: number;      // Lifetime earnings
    totalWithdrawn: number;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
}, { timestamps: true });

export const WalletModel = mongoose.model<IWallet>('Wallet', WalletSchema);
