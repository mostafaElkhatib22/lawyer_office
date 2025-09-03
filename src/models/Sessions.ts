import mongoose, { Schema } from "mongoose";

const SessionSchema = new Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: [true, "القضية المرتبطة بالجلسة مطلوبة."],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "الموكل المرتبط بالجلسة مطلوب."],
    },
    date: {
      type: Date,
      required: [true, "تاريخ الجلسة مطلوب."],
    },
    time: {
      type: String,
      required: [true, "وقت الجلسة مطلوب."],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "موضوع الجلسة مطلوب."],
      trim: true,
    },
    status: {
      type: String,
      enum: ["قادمة", "جارية", "منتهية", "مؤجلة"],
      default: "قادمة",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Session =
  mongoose.models.Session || mongoose.model("Session", SessionSchema);

export default Session;
