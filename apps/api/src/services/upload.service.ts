import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { env } from "../config/env.js";
import { cloudinary, cloudinaryEnabled } from "../config/cloudinary.js";

function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export async function storeUpload(file: Express.Multer.File) {
  if (cloudinaryEnabled) {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "lms" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        },
      );
      stream.end(file.buffer);
    });

    return {
      fileUrl: result.secure_url,
      publicId: result.public_id,
    };
  }

  const uploadDir = join(process.cwd(), env.LOCAL_UPLOAD_DIR);
  ensureDir(uploadDir);
  const fileName = `${randomUUID()}-${file.originalname}`;
  const fullPath = join(uploadDir, fileName);
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(fullPath);
    stream.on("finish", () => resolve());
    stream.on("error", reject);
    stream.end(file.buffer);
  });

  return {
    fileUrl: `${env.SERVER_ORIGIN}/uploads/${fileName}`,
    publicId: fileName,
  };
}
