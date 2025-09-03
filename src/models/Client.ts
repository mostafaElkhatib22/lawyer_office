
// src/models/Client.ts
import mongoose, { Document, Schema } from 'mongoose';

// تعريف الـ Interface الخاص بالموكل
export interface IClient extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  owner: mongoose.Schema.Types.ObjectId; // ID المحامي اللي الموكل ده تبعه
  createdAt: Date;
  updatedAt: Date;
}

// تعريف الـ Schema الخاص بالموكل
const ClientSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم الموكل مطلوب.'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'من فضلك أدخل بريد إلكتروني صحيح.'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // يفترض أن لديك User model للمحامين
      required: [true, 'معرف المالك (المحامي) مطلوب.'],
    },
  },
  {
    timestamps: true, // لإضافة createdAt و updatedAt تلقائيًا
  }
);

// تصدير الموديل، أو استخدامه لو كان موجود بالفعل
const Client = (mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema)) as mongoose.Model<IClient>;

export default Client;
