import mongoose, { Schema, Document } from 'mongoose';

//interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  fcmToken?: string;
  collegeId?: string;
  profilePicture?: string;
  phoneNumber?: string;
  studentId?: string;
  batch?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  id: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
}


const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fcmToken: { type: String },
  collegeId: { type: String },
  profilePicture: { type: String },
  phoneNumber: { type: String },
  studentId: { type: String },
  batch: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Number },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

UserSchema.virtual('id').get(function (this: IUser) {
  return this._id.toHexString();
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
