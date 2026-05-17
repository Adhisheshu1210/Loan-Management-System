"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Search, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { AdminLoan, AdminLoanReview, downloadCsv, formatCurrency, loanCode, loanStatusOptions, SectionCard, statusClass, statusLabel } from "@/components/dashboard/admin-dashboard-utils";
import { resolveFileUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function DashboardLoansPage() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedLoan, setSelectedLoan] = useState<AdminLoan | null>(null);
  const [review, setReview] = useState<AdminLoanReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const [sanctionNotes, setSanctionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  const loadLoans = () => {
    setLoading(true);
    setError(null);
    api.get("/admin/loans", {
      params: {
        page,
        limit,
        status,
        search: query.trim() || undefined,
      },
    })
      .then((response) => {
        setLoans(response.data.data ?? []);
        setTotal(Number(response.data.meta?.total ?? 0));
      })
      .catch((caughtError: any) => {
        setError(caughtError.response?.data?.message ?? "Unable to load loans");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const timeout = window.setTimeout(loadLoans, 200);
    return () => window.clearTimeout(timeout);
  }, [page, limit, query, status]);

  const exportCsv = async () => {
    const response = await api.get("/admin/dashboard/loans/export", {
      params: {
        search: query.trim() || undefined,
        status,
      },
      responseType: "blob",
    });
    downloadCsv("admin-loans.csv", response.data);
  };

  const loadLoanReview = async (loan: AdminLoan) => {
    setSelectedLoan(loan);
    setReview(null);
    setReviewError(null);
    setReviewLoading(true);
    try {
      const response = await api.get(`/admin/dashboard/loans/${loan._id}/review`);
      setReview(response.data.data ?? null);
    } catch (caughtError: any) {
      setReviewError(caughtError.response?.data?.message ?? "Unable to load loan review");
    } finally {
      setReviewLoading(false);
    }
  };

  const saveAction = async (action: "SANCTION" | "REJECT" | "DISBURSE" | "CLOSE") => {
    const loan = review?.loan ?? selectedLoan;
    if (!loan) return;

    try {
      setSavingAction(true);
      if (action === "SANCTION") {
        if (!sanctionNotes.trim()) throw new Error("Enter sanction notes before approving");
        await api.patch(`/loans/${loan._id}/sanction`, { notes: sanctionNotes.trim() });
      }
      if (action === "REJECT") {
        if (!rejectionReason.trim()) throw new Error("Enter a rejection reason");
        await api.patch(`/loans/${loan._id}/reject`, { reason: rejectionReason.trim() });
      }
      if (action === "DISBURSE") {
        if (!transactionReference.trim()) throw new Error("Enter a transaction reference");
        await api.patch(`/loans/${loan._id}/disburse`, { transactionReference: transactionReference.trim() });
      }
      if (action === "CLOSE") {
        await api.patch(`/loans/${loan._id}/close`);
      }
      toast.success("Loan updated successfully");
      setSelectedLoan(null);
      setReview(null);
      setSanctionNotes("");
      setRejectionReason("");
      setTransactionReference("");
      loadLoans();
    } catch (caughtError: any) {
      toast.error(caughtError.response?.data?.message ?? caughtError.message ?? "Unable to update loan");
    } finally {
      setSavingAction(false);
    }
  };

  const currentLoan = review?.loan ?? selectedLoan;

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Loans</p>
            <h2 className="mt-2 text-3xl font-semibold">Loan lifecycle control</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Search loan records, export the current slice, and review an application end-to-end.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={exportCsv}><UploadCloud className="h-4 w-4" />Export CSV</Button>
          </div>
        </div>
      </SectionCard>

      <Card className="bg-card/85">
        <CardHeader>
          <CardTitle>Loan management</CardTitle>
          <CardDescription>Search, paginate, and review loan records with their borrower data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search loans, borrowers, or amounts" className="pl-10" />
            </div>
            <Select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
              {loanStatusOptions.map((item) => <option key={item} value={item}>{item === "ALL" ? "All statuses" : item}</option>)}
            </Select>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            {loading ? (
              <div className="grid gap-3 p-6">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
            ) : error ? (
              <div className="grid gap-3 p-10 text-center text-sm text-rose-700">{error}</div>
            ) : loans.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan._id}>
                      <TableCell>{loanCode(loan._id)}</TableCell>
                      <TableCell>
                        <div className="grid">
                          <span className="font-medium">{loan.borrower?.name ?? "Unknown borrower"}</span>
                          <span className="text-xs text-muted-foreground">{loan.borrower?.email ?? "No email"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(loan.amount)}</TableCell>
                      <TableCell><Badge className={statusClass(loan.status)}>{loan.status}</Badge></TableCell>
                      <TableCell>{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => loadLoanReview(loan)}>
                            Review
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                          {loan.proofFileUrl ? (
                            <Button asChild variant="outline" size="sm">
                                <a href={resolveFileUrl(loan.proofFileUrl)} target="_blank" rel="noreferrer">Open file</a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No proof</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid gap-3 p-10 text-center">
                <p className="font-medium">No loans match the current filters.</p>
                <p className="text-sm text-muted-foreground">Try clearing the search or selecting a different status.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {total ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => (current * limit < total ? current + 1 : current))} disabled={page * limit >= total}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(currentLoan)} onOpenChange={(open) => !open && (setSelectedLoan(null), setReview(null))} contentClassName="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan review</DialogTitle>
            <DialogDescription>Inspect the current application, borrower profile, documents, and repayment history.</DialogDescription>
          </DialogHeader>

          {reviewLoading ? (
            <div className="grid gap-3 py-4">
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
            </div>
          ) : reviewError ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700">{reviewError}</div>
          ) : currentLoan ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border bg-secondary/20 p-4">
                  <p className="text-sm font-medium">{review?.borrower?.name ?? currentLoan.borrower?.name ?? "Borrower"}</p>
                  <p className="text-xs text-muted-foreground">{loanCode(currentLoan._id)} · {currentLoan.status}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Amount</span><p className="font-medium">{formatCurrency(currentLoan.amount)}</p></div>
                    <div><span className="text-muted-foreground">Tenure</span><p className="font-medium">{currentLoan.tenure} days</p></div>
                    <div><span className="text-muted-foreground">Interest</span><p className="font-medium">{formatCurrency(currentLoan.interestAmount)}</p></div>
                    <div><span className="text-muted-foreground">Outstanding</span><p className="font-medium">{formatCurrency(currentLoan.outstandingAmount)}</p></div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-secondary/20 p-4">
                  <p className="text-sm font-medium">Actions</p>
                  {currentLoan.status === "APPLIED" ? (
                    <div className="mt-3 grid gap-3">
                      <Textarea value={sanctionNotes} onChange={(event) => setSanctionNotes(event.target.value)} placeholder="Sanction notes" />
                      <Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Rejection reason" />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => saveAction("SANCTION")} disabled={savingAction}>Sanction</Button>
                        <Button variant="destructive" onClick={() => saveAction("REJECT")} disabled={savingAction}>Reject</Button>
                      </div>
                    </div>
                  ) : null}
                  {currentLoan.status === "SANCTIONED" ? (
                    <div className="mt-3 grid gap-3">
                      <Input value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="Transaction reference" />
                      <Button onClick={() => saveAction("DISBURSE")} disabled={savingAction}>Disburse</Button>
                    </div>
                  ) : null}
                  {currentLoan.status === "DISBURSED" ? (
                    <div className="mt-3">
                      <Button onClick={() => saveAction("CLOSE")} disabled={savingAction}>Close loan</Button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border bg-secondary/20 p-4">
                  <p className="text-sm font-medium">Borrower profile</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>Email: {review?.borrower?.email ?? currentLoan.borrower?.email ?? "-"}</p>
                    <p>Phone: {review?.borrower?.phone ?? currentLoan.borrower?.phone ?? "-"}</p>
                    <p>PAN: {review?.profile?.pan ?? "-"}</p>
                    <p>Employment: {review?.profile?.employmentMode ?? "-"}</p>
                    <p>Address: {review?.profile?.address ?? "-"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-secondary/20 p-4">
                  <p className="text-sm font-medium">Documents</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    {(review?.documents ?? []).length ? (
                      review?.documents.map((document) => (
                        <div key={document._id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/70 px-3 py-2">
                          <div className="grid">
                            <span className="font-medium text-foreground">{document.fileType ?? "Document"}</span>
                            <span className="text-xs">{document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : "Upload date unavailable"}</span>
                          </div>
                          {document.fileUrl ? (
                            <Button asChild size="sm" variant="outline">
                                <a href={resolveFileUrl(document.fileUrl)} target="_blank" rel="noreferrer">Open proof</a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No proof</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No proof uploaded.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-secondary/20 p-4">
                  <p className="text-sm font-medium">Repayment history</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    {(review?.payments ?? []).length ? review?.payments.map((payment) => <p key={payment._id}>{new Date(payment.paymentDate).toLocaleDateString()} · {formatCurrency(payment.amount)}</p>) : <p>No repayments recorded.</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedLoan(null); setReview(null); }}>Close</Button>
          </DialogFooter>
      </Dialog>
    </div>
  );
}