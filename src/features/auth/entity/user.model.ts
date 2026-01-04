import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  fcmToken?: string;
  collegeId?: string;
  id: string; // virtual id for TS
}


const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fcmToken: { type: String },
  collegeId: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

UserSchema.virtual('id').get(function (this: IUser) {
  return this._id.toHexString();
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
