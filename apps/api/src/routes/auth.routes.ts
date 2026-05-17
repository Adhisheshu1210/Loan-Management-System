import { Router } from "express";
import { forgot, login, logout, me, refresh, register, reset } from "../controllers/auth.controller.js";
import { startChangePhoneOtp, verifyChangePhoneOtp } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, secondaryEmailStartSchema, secondaryEmailVerifySchema, changePhoneStartSchema, changePhoneVerifySchema } from "../validators/auth.validators.js";
import { startSecondaryEmailOtp, verifySecondaryEmailOtp } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgot);
authRouter.post("/reset-password", validate(resetPasswordSchema), reset);
authRouter.get("/me", authMiddleware, me);
authRouter.post("/secondary-email/start", authMiddleware, validate(secondaryEmailStartSchema), startSecondaryEmailOtp);
authRouter.post("/secondary-email/verify", authMiddleware, validate(secondaryEmailVerifySchema), verifySecondaryEmailOtp);
authRouter.post("/change-phone/start", authMiddleware, validate(changePhoneStartSchema), startChangePhoneOtp);
authRouter.post("/change-phone/verify", authMiddleware, validate(changePhoneVerifySchema), verifyChangePhoneOtp);
