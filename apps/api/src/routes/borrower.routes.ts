import { Router } from "express";
import { upload } from "../config/multer.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { applyLoanSchema, borrowerAuthSchema, borrowerProfileSchema, phoneVerificationStartSchema, phoneVerificationVerifySchema } from "../validators/borrower.validators.js";
import { borrowerAuth, dashboard, myLoans, startPhoneOtp, submitLoanApplication, upsertProfile, uploadDocument, verifyPhoneOtp, withdrawLoanApplication } from "../controllers/borrower.controller.js";

export const borrowerRouter = Router();

borrowerRouter.post("/auth", validate(borrowerAuthSchema), borrowerAuth);
borrowerRouter.post("/profile", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), validate(borrowerProfileSchema), upsertProfile);
borrowerRouter.post("/upload", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), upload.single("file"), uploadDocument);
borrowerRouter.post("/phone-otp/start", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), validate(phoneVerificationStartSchema), startPhoneOtp);
borrowerRouter.post("/phone-otp/verify", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), validate(phoneVerificationVerifySchema), verifyPhoneOtp);
borrowerRouter.post("/apply-loan", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), validate(applyLoanSchema), submitLoanApplication);
borrowerRouter.patch("/loans/:id/withdraw", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), withdrawLoanApplication);
borrowerRouter.get("/my-loans", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), myLoans);
borrowerRouter.get("/dashboard", authMiddleware, roleMiddleware("BORROWER", "ADMIN"), dashboard);
