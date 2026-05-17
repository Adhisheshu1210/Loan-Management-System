import { Router } from "express";
import { smsTest } from "../controllers/debug.controller.js";
import { sendDemoOtp } from "../controllers/debug-otp.controller.js";
import { impersonate } from "../controllers/debug.controller.js";
export const debugRouter = Router();

debugRouter.post("/sms-test", smsTest);
debugRouter.post("/send-otp", sendDemoOtp);
// Dev-only: create auth cookies for a demo user (email)
debugRouter.post("/impersonate", impersonate);
