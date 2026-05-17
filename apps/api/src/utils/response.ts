export function sendResponse<T>(res: any, statusCode: number, payload: { success?: boolean; message: string; data?: T; meta?: Record<string, unknown> }) {
  return res.status(statusCode).json({
    success: payload.success ?? statusCode < 400,
    message: payload.message,
    data: payload.data ?? null,
    meta: payload.meta ?? null,
  });
}
