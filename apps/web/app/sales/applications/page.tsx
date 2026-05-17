"use client";

import { useEffect, useMemo, useState } from "react";
import { ExecutiveShell } from "@/components/executive/executive-shell";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SalesBorrower = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileReady: boolean;
  latestApplicationStatus: string;
  lastActivityAt: string;
};

export default function SalesApplicationsPage() {
  const [items, setItems] = useState<SalesBorrower[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("INCOMPLETE");

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/sales/borrowers", {
        params: { search: search.trim() || undefined, status },
      });
      setItems(response.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [search, status]);

  const followupCount = useMemo(() => items.filter((item) => ["NEW", "INCOMPLETE", "APPLIED"].includes(item.latestApplicationStatus)).length, [items]);

  return (
    <ExecutiveShell role="SALES" section="features">
      <div className="space-y-6">
        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Application Progress Tracking</CardTitle>
            <CardDescription>Track incomplete applications and follow up borrowers based on current status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search borrower" />
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              {["INCOMPLETE", "NEW", "APPLIED", "SANCTIONED", "DISBURSED", "REJECTED", "CLOSED", "ALL"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/85"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Tracked</p><p className="mt-2 text-3xl font-semibold">{items.length}</p></CardContent></Card>
          <Card className="bg-card/85"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Follow-ups Needed</p><p className="mt-2 text-3xl font-semibold">{followupCount}</p></CardContent></Card>
          <Card className="bg-card/85"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Ready Profiles</p><p className="mt-2 text-3xl font-semibold">{items.filter((item) => item.profileReady).length}</p></CardContent></Card>
        </div>

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Follow-up List</CardTitle>
            <CardDescription>Use contact details to pursue pending borrowers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {!loading && !items.length ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No records found for selected status.</div> : null}
            {items.map((borrower) => (
              <div key={borrower.id} className="rounded-2xl border bg-secondary/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{borrower.name}</p>
                    <p className="text-xs text-muted-foreground">{borrower.email} · {borrower.phone}</p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-700">{borrower.latestApplicationStatus}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Last activity: {new Date(borrower.lastActivityAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ExecutiveShell>
  );
}