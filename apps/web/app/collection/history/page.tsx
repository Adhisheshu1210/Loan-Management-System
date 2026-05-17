"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExecutiveShell } from "@/components/executive/executive-shell";
import { ModuleHero } from "@/components/executive/module-hero";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { downloadBlobAsFile } from "@/lib/utils";

type CollectionItem = {
  _id: string;
  loanId?: string;
  amount: number;
  utrNumber?: string;
  paymentDate?: string;
  borrower?: { name?: string; email?: string } | null;
  collectorName?: string;
  collectorEmail?: string;
};

export default function CollectionHistoryPage() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/collection/history", { params: { search: search.trim() || undefined, page, limit } });
      setItems(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Unable to load collection history");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    const res = await api.get("/dashboard/collection/history/export", { params: { search: search.trim() || undefined }, responseType: "blob" });
    downloadBlobAsFile(res.data, "collection-history.csv");
  };

  useEffect(() => {
    const t = window.setTimeout(load, 150);
    return () => window.clearTimeout(t);
  }, [search, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <ExecutiveShell role="COLLECTION" section="features">
      <div className="space-y-6">
        <ModuleHero
          eyebrow="Collection History"
          title="Reconciliation and receipts"
          description="Exportable list of payments with UTRs, collectors, and timestamps for audit and reconciliation."
          imageSrc="/illustrations/collection-module.svg"
          imageAlt="Collection history"
          className="overflow-hidden border-0 bg-gradient-to-r from-slate-900/5 via-cyan-700/5 to-cyan-500/5"
        />

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Collection History</CardTitle>
            <CardDescription>Filter by borrower, UTR or date. Export CSV for accounting.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto]">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search borrower, UTR or loan id" />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))}>
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Recorded repayments</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {!loading && !items.length ? <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No payments found.</div> : null}
            {items.map((it) => (
              <div key={it._id} className="rounded-2xl border bg-secondary/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">₹{it.amount.toLocaleString()} · UTR {it.utrNumber ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">{it.borrower?.name ?? "Borrower"} · {it.borrower?.email ?? "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Loan {it.loanId ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">{it.paymentDate ? new Date(it.paymentDate).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Collected by: {it.collectorName ?? "-"} {it.collectorEmail ? `· ${it.collectorEmail}` : ""}</p>
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
              <span className="text-muted-foreground">Page {page} of {totalPages} ({total} records)</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Previous</Button>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ExecutiveShell>
  );
}
