import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { paymentSchema } from "../validators/payment.validators.js";
import { createPayment, getPayments } from "../controllers/payment.controller.js";

export const paymentRouter = Router();

paymentRouter.post("/", authMiddleware, roleMiddleware("ADMIN", "COLLECTION"), validate(paymentSchema), createPayment);
paymentRouter.get("/:loanId", authMiddleware, roleMiddleware("ADMIN", "COLLECTION", "SANCTION", "DISBURSEMENT", "SALES"), getPayments);
