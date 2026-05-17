import { Schema, model, Types } from "mongoose";

export interface DocumentRecord {
  _id: Types.ObjectId;
  borrowerId: Types.ObjectId;
  fileUrl: string;
  fileType: string;
  publicId: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<DocumentRecord>(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    publicId: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Document = model<DocumentRecord>("Document", documentSchema);
