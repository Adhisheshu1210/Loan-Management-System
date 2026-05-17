import { Schema, model, Types } from "mongoose";

export interface TwilioMessageStatusDocument {
  _id: Types.ObjectId;
  sid: string;
  from: string;
  to: string;
  status: string;
  errorCode?: number | null;
  errorMessage?: string | null;
  raw?: any;
  createdAt: Date;
  updatedAt: Date;
}

const twilioStatusSchema = new Schema<TwilioMessageStatusDocument>(
  {
    sid: { type: String, required: true, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    status: { type: String, required: true },
    errorCode: { type: Number, default: null },
    errorMessage: { type: String, default: null },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const TwilioMessageStatus = model<TwilioMessageStatusDocument>(
  "TwilioMessageStatus",
  twilioStatusSchema,
);
