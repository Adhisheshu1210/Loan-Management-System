import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loanActionSchema } from "../validators/loan.validators.js";
import { close, disburse, getAllLoans, getLoan, reject, sanction } from "../controllers/loan.controller.js";

export const loanRouter = Router();

loanRouter.get("/", authMiddleware, roleMiddleware("ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"), getAllLoans);
loanRouter.get("/:id", authMiddleware, roleMiddleware("ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION", "BORROWER"), getLoan);
loanRouter.patch("/:id/sanction", authMiddleware, roleMiddleware("ADMIN", "SANCTION"), validate(loanActionSchema), sanction);
loanRouter.patch("/:id/reject", authMiddleware, roleMiddleware("ADMIN", "SANCTION"), validate(loanActionSchema), reject);
loanRouter.patch("/:id/disburse", authMiddleware, roleMiddleware("ADMIN", "DISBURSEMENT"), validate(loanActionSchema), disburse);
loanRouter.patch("/:id/close", authMiddleware, roleMiddleware("ADMIN", "COLLECTION"), close);
