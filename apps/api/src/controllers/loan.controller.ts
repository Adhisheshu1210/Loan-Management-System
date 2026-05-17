import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { closeLoan, disburseLoan, getLoanById, listLoans, rejectLoan, sanctionLoan } from "../services/loan.service.js";
import { sendResponse } from "../utils/response.js";

export const getAllLoans = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const filter = status ? { status } : {};
  const result = await listLoans(filter, page, limit);
  sendResponse(res, 200, { message: "Loans fetched", data: result.items, meta: { total: result.total, page, limit } });
});

export const getLoan = asyncHandler(async (req: Request, res: Response) => {
  const loan = await getLoanById(String(req.params.id));
  sendResponse(res, 200, { message: "Loan fetched", data: loan });
});

export const sanction = asyncHandler(async (req: Request, res: Response) => {
  const loan = await sanctionLoan(String(req.params.id), req.user!.id, req.body.notes);
  sendResponse(res, 200, { message: "Loan sanctioned", data: loan });
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const loan = await rejectLoan(String(req.params.id), req.user!.id, req.body.reason);
  sendResponse(res, 200, { message: "Loan rejected", data: loan });
});

export const disburse = asyncHandler(async (req: Request, res: Response) => {
  const loan = await disburseLoan(String(req.params.id), req.user!.id, req.body.transactionReference, req.body.proofUrl, req.body.disbursementDate);
  sendResponse(res, 200, { message: "Loan disbursed", data: loan });
});

export const close = asyncHandler(async (req: Request, res: Response) => {
  const loan = await closeLoan(String(req.params.id));
  sendResponse(res, 200, { message: "Loan closed", data: loan });
});
