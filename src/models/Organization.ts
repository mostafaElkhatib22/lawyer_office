// src/models/Organization.js
import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the office name.'],
  },
  address: {
    type: String,
  },
  phones: [
    {
      type: String,
    },
  ],
  email: {
    type: String,
  },
  website: {
    type: String,
  },
  logo: {
    type: String, // هتحفظ لينك للصورة (cloud storage أو uploads folder)
  },
  registrationNumber: {
    type: String, // رقم النقابة
  },
  taxNumber: {
    type: String,
  },
  commercialNumber: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // الـ Admin الأساسي
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
