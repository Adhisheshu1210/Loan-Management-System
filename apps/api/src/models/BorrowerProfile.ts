import { Schema, model, Types } from "mongoose";

export type EmploymentMode = "Salaried" | "Self-Employed" | "Unemployed";

export interface BorrowerProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  pan: string;
  dob: Date;
  salary: number;
  employmentMode: EmploymentMode;
  address: string;
  city: string;
  state: string;
  pincode: string;
  breEligible: boolean;
  breReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

const borrowerProfileSchema = new Schema<BorrowerProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dob: { type: Date, required: true },
    salary: { type: Number, required: true },
    employmentMode: { type: String, enum: ["Salaried", "Self-Employed", "Unemployed"], required: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    breEligible: { type: Boolean, default: false },
    breReasons: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const BorrowerProfile = model<BorrowerProfileDocument>("BorrowerProfile", borrowerProfileSchema);
