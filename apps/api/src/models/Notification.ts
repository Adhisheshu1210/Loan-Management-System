import { Schema, model, Types } from "mongoose";

export interface NotificationDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Notification = model<NotificationDocument>("Notification", notificationSchema);
