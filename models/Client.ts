import mongoose, { Document, Model, Schema } from "mongoose";

interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const ClientSchema: Schema<IClient> = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  address: { type: String, required: true },
});

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
