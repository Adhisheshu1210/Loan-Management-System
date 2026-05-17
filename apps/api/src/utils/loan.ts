export function calculateLoanRepayment(amount: number, tenureDays: number, interestRate = 12) {
  const interestAmount = (amount * interestRate * tenureDays) / (365 * 100);
  const totalRepayment = amount + interestAmount;
  const dailyEmi = totalRepayment / Math.max(tenureDays, 1);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + tenureDays);

  return {
    interestAmount: Number(interestAmount.toFixed(2)),
    totalRepayment: Number(totalRepayment.toFixed(2)),
    dailyEmi: Number(dailyEmi.toFixed(2)),
    dueDate,
  };
}
