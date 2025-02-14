import mongoose, { Document, Model, Schema } from "mongoose";

interface ICase extends Document {
  client: mongoose.Types.ObjectId;
  caseTypeOF: string;
  type:string
  court: string;
  decision: string;
  caseNumber: string;
  opponents: string[]; // استخدام Array<string>
  year: string;
  attorneyNumber: string;
  caseDate: Date;
  sessiondate: Date;
  nots: string;
  files: string[];
}

const CaseSchema: Schema<ICase> = new Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  caseTypeOF: { type: String, required: true },
  court: { type: String, required: true },
  type: { type: String, required: true },
  caseNumber: { type: String, required: true },
  year: { type: String, required: true },
  attorneyNumber: { type: String, required: true },
  caseDate: { type: Date, required: true },
  sessiondate: { type: Date, required: true },
  decision: { type: String, required: false },
  nots: { type: String, required: false },
  opponents: { type: [String], default: [], required: true }, // تحديد نوع الـ opponents ليكون array من strings
  files: { type: [String], default: [], required: false }, // تحديد نوع الـ opponents ليكون array من strings
});

const Case: Model<ICase> =
  mongoose.models.Case || mongoose.model("Case", CaseSchema);

export default Case;
