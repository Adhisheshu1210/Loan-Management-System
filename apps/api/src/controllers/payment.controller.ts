import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { addPayment, listPaymentsByLoan } from "../services/payment.service.js";
import { sendResponse } from "../utils/response.js";

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await addPayment({ ...req.body, collectedBy: req.user!.id });
  sendResponse(res, 201, { message: "Payment recorded", data: payment });
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await listPaymentsByLoan(String(req.params.loanId));
  sendResponse(res, 200, { message: "Payments fetched", data: payments });
});
