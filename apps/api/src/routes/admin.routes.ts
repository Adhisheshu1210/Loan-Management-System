import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { analytics, changeRole, dashboard, documents, exportLoans, exportPayments, exportUsers, listUsers, loanReview, loans, payments, profile, updateProfile } from "../controllers/admin.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { z } from "zod";

const adminProfileUpdateSchema = z.object({
	name: z.string().trim().min(2),
	phone: z.string().trim().min(7),
	secondaryEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
});

export const adminRouter = Router();

adminRouter.get("/dashboard/overview", authMiddleware, roleMiddleware("ADMIN"), dashboard);
adminRouter.get("/dashboard", authMiddleware, roleMiddleware("ADMIN"), dashboard);
adminRouter.get("/dashboard/profile", authMiddleware, roleMiddleware("ADMIN"), profile);
adminRouter.patch("/dashboard/profile", authMiddleware, roleMiddleware("ADMIN"), validate(adminProfileUpdateSchema), updateProfile);
adminRouter.get("/dashboard/analytics", authMiddleware, roleMiddleware("ADMIN"), analytics);
adminRouter.get("/dashboard/payments", authMiddleware, roleMiddleware("ADMIN"), payments);
adminRouter.get("/dashboard/payments/export", authMiddleware, roleMiddleware("ADMIN"), exportPayments);
adminRouter.get("/dashboard/documents", authMiddleware, roleMiddleware("ADMIN"), documents);
adminRouter.get("/dashboard/users", authMiddleware, roleMiddleware("ADMIN"), listUsers);
adminRouter.get("/dashboard/users/export", authMiddleware, roleMiddleware("ADMIN"), exportUsers);
adminRouter.get("/dashboard/loans", authMiddleware, roleMiddleware("ADMIN"), loans);
adminRouter.get("/dashboard/loans/export", authMiddleware, roleMiddleware("ADMIN"), exportLoans);
adminRouter.get("/dashboard/loans/:id/review", authMiddleware, roleMiddleware("ADMIN"), loanReview);
adminRouter.get("/loans", authMiddleware, roleMiddleware("ADMIN"), loans);
adminRouter.get("/users", authMiddleware, roleMiddleware("ADMIN"), listUsers);
adminRouter.patch("/users/:id/role", authMiddleware, roleMiddleware("ADMIN"), changeRole);
