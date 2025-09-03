// src/models/Case.js
import mongoose from 'mongoose';

const CaseSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId, // <--- تم التعديل هنا: الآن هو ObjectId
    ref: 'Client', // <--- وتم إضافة 'ref' للإشارة إلى موديل Client
    required: [true, 'Please add a client.'], // <--- تعديل الرسالة لتناسب ObjectId
  },
  caseTypeOF: {
    type: String,
    required: [true, 'Please add a case type.'],
  },
  type: {
    type: String,
    required: [true, 'Please add the nature of the case.'],
  },
  court: {
    type: String,
    required: [true, 'Please add the court name.'],
  },
  caseNumber: {
    type: String,
    required: [true, 'Please add the case number.'],
  },
  year: {
    type: String,
    required: [true, 'Please add the case year.'],
  },
  decision: {
    type: String,
    default: '',
  },
  attorneyNumber: {
    type: String,
    required: [true, 'Please add the attorney number.'],
  },
  caseDate: {
    type: Date,
    default: Date.now,
  },
  sessiondate: {
    type: Date,
    default: Date.now,
  },
  opponents: {
    type: [String], // Array of opponent names
    default: [],
  },
  nots: {
    type: String,
    default: '',
  },
  files: {
    type: [String], // Array of Cloudinary image URLs
    default: [],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the 'User' model
    required: true,
  },
}, {
  timestamps: true
});

export default mongoose.models.Case || mongoose.model('Case', CaseSchema);
