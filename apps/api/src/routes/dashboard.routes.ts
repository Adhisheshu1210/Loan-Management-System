import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import {
	collectionAddPayment,
	collectionLoans,
	collectionPayments,
	collectionPaymentsExport,
	collectionHistory,
	collectionHistoryExport,
	disburseLoanModule,
	disbursementLoans,
	disbursementLoansExport,
	disbursementProofUpload,
	disbursementHistory,
	disbursementHistoryExport,
	loanTimeline,
	profile,
	recentLoans,
	salesBorrowers,
	salesBorrowersExport,
	sanctionApplications,
	sanctionDecision,
	sanctionHistory,
	sanctionHistoryExport,
	sanctionLoansExport,
	stats,
	updateProfile,
	workspace,
} from "../controllers/dashboard.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { z } from "zod";
import { upload } from "../config/multer.js";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", authMiddleware, roleMiddleware("ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"), stats);
dashboardRouter.get("/recent-loans", authMiddleware, roleMiddleware("ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"), recentLoans);
dashboardRouter.get("/workspace", authMiddleware, roleMiddleware("SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"), workspace);

const executiveProfileSchema = z.object({
	name: z.string().trim().min(2),
	phone: z.string().trim().min(7),
	secondaryEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
});

dashboardRouter.get("/profile", authMiddleware, roleMiddleware("ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"), profile);
dashboardRouter.patch("/profile", authMiddleware, roleMiddleware("ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"), validate(executiveProfileSchema), updateProfile);

const sanctionDecisionSchema = z.object({
	decision: z.enum(["APPROVE", "REJECT"]),
	notes: z.string().trim().optional(),
	reason: z.string().trim().optional(),
});

const disbursementMarkSchema = z.object({
	transactionReference: z.string().trim().min(3),
	disbursementDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date").optional(),
	proofUrl: z.string().url().optional(),
});

const collectionPaymentSchema = z.object({
	loanId: z.string().min(1),
	amount: z.number().positive(),
	utrNumber: z.string().trim().min(4),
	paymentDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
});

dashboardRouter.get("/sales/borrowers", authMiddleware, roleMiddleware("SALES", "ADMIN"), salesBorrowers);
dashboardRouter.get("/sales/borrowers/export", authMiddleware, roleMiddleware("SALES", "ADMIN"), salesBorrowersExport);

dashboardRouter.get("/sanction/loans", authMiddleware, roleMiddleware("SANCTION", "ADMIN"), sanctionApplications);
dashboardRouter.get("/sanction/loans/export", authMiddleware, roleMiddleware("SANCTION", "ADMIN"), sanctionLoansExport);
dashboardRouter.patch("/sanction/loans/:loanId/decision", authMiddleware, roleMiddleware("SANCTION", "ADMIN"), validate(sanctionDecisionSchema), sanctionDecision);
dashboardRouter.get("/sanction/history", authMiddleware, roleMiddleware("SANCTION", "ADMIN"), sanctionHistory);
dashboardRouter.get("/sanction/history/export", authMiddleware, roleMiddleware("SANCTION", "ADMIN"), sanctionHistoryExport);

dashboardRouter.get("/disbursement/loans", authMiddleware, roleMiddleware("DISBURSEMENT", "ADMIN"), disbursementLoans);
dashboardRouter.get("/disbursement/loans/export", authMiddleware, roleMiddleware("DISBURSEMENT", "ADMIN"), disbursementLoansExport);
dashboardRouter.patch("/disbursement/loans/:loanId/mark", authMiddleware, roleMiddleware("DISBURSEMENT", "ADMIN"), validate(disbursementMarkSchema), disburseLoanModule);
dashboardRouter.post("/disbursement/loans/:loanId/proof", authMiddleware, roleMiddleware("DISBURSEMENT", "ADMIN"), upload.single("file"), disbursementProofUpload);
dashboardRouter.get("/disbursement/history", authMiddleware, roleMiddleware("DISBURSEMENT", "ADMIN"), disbursementHistory);
dashboardRouter.get("/disbursement/history/export", authMiddleware, roleMiddleware("DISBURSEMENT", "ADMIN"), disbursementHistoryExport);

dashboardRouter.get("/collection/loans", authMiddleware, roleMiddleware("COLLECTION", "ADMIN"), collectionLoans);
dashboardRouter.post("/collection/payments", authMiddleware, roleMiddleware("COLLECTION", "ADMIN"), validate(collectionPaymentSchema), collectionAddPayment);
dashboardRouter.get("/collection/payments", authMiddleware, roleMiddleware("COLLECTION", "ADMIN"), collectionPayments);
dashboardRouter.get("/collection/payments/export", authMiddleware, roleMiddleware("COLLECTION", "ADMIN"), collectionPaymentsExport);
dashboardRouter.get("/collection/history", authMiddleware, roleMiddleware("COLLECTION", "ADMIN"), collectionHistory);
dashboardRouter.get("/collection/history/export", authMiddleware, roleMiddleware("COLLECTION", "ADMIN"), collectionHistoryExport);

dashboardRouter.get("/loans/:loanId/timeline", authMiddleware, roleMiddleware("ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"), loanTimeline);
