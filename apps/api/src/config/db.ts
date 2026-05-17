import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    if (env.NODE_ENV === "production") {
      throw error;
    }

    mongoose.set("bufferCommands", false);
    console.warn("MongoDB Atlas auth failed; continuing without a database connection for local development.");
  }
}
