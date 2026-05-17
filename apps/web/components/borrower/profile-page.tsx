"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, UserRound, BadgeIndianRupee, FileText, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { canonicalizePhoneNumber } from "@shared/phone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type BorrowerLoan = {
  _id: string;
  amount: number;
  tenure: number;
  status: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BorrowerDashboardData = {
  account: { id: string; name: string; email: string; phone: string; role: string; secondaryEmail?: string | null; secondaryEmailVerifiedAt?: string | null; phoneVerifiedAt?: string | null } | null;
  profile: { pan?: string; dob?: string; salary?: number; employmentMode?: string; address?: string; city?: string; state?: string; pincode?: string } | null;
  loans: BorrowerLoan[];
  documents: Array<{ _id: string; fileUrl: string; fileType: string; uploadedAt: string }>;
  payments: Array<{ _id: string; loanId: string; amount: number; utrNumber: string; paymentDate: string }>;
  summary: { totalApplications: number; pending: number; withdrawn: number; approved: number; disbursed: number; rejected: number; closed: number; appliedValue: number };
};

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().refine((value) => canonicalizePhoneNumber(value).length === 10, "Enter a valid phone number"),
  pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter a valid PAN"),
  dob: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date of birth"),
  salary: z.coerce.number().min(0, "Enter a valid salary"),
  employmentMode: z.enum(["Salaried", "Self-Employed", "Unemployed"]),
  address: z.string().trim().min(3, "Enter your address"),
  city: z.string().trim().min(2, "Enter your city"),
  state: z.string().trim().min(2, "Enter your state"),
  pincode: z.string().trim().min(4, "Enter a valid pincode"),
});

const guidanceCards = [
  { title: "Keep identity documents up to date", description: "Your PAN, address proof, and salary data help the BRE step move faster.", icon: FileText },
  { title: "Maintain healthy repayment history", description: "A clean repayment trail makes every future application easier to review.", icon: ShieldCheck },
  { title: "Use the same contact details", description: "The backend matches your borrower profile with your verified account phone and email.", icon: UserRound },
  { title: "Track review milestones", description: "Approved, disbursed, and closed statuses are reflected directly from the database.", icon: Clock3 },
];

function statusLabel(status: string) {
  switch (status) {
    case "APPLIED":
      return "Pending";
    case "WITHDRAWN":
      return "Withdrawn";
    case "SANCTIONED":
      return "Approved";
    case "DISBURSED":
      return "Disbursed";
    case "CLOSED":
      return "Closed";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "APPLIED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700";
    case "WITHDRAWN":
      return "border-slate-500/30 bg-slate-500/10 text-slate-700";
    case "SANCTIONED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
    case "DISBURSED":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700";
    case "REJECTED":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700";
    case "CLOSED":
      return "border-slate-500/30 bg-slate-500/10 text-slate-700";
    default:
      return "bg-secondary";
  }
}

export function BorrowerProfilePage() {
  const auth = useAuthStore();
  const [dashboard, setDashboard] = useState<BorrowerDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: auth.user?.name ?? "",
    phone: auth.user?.phone ?? "",
    pan: "",
    dob: "",
    salary: "",
    employmentMode: "Salaried",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadingError(null);
    api.get("/borrower/dashboard")
      .then((response) => {
        if (!active) return;
        const data = response.data.data ?? null;
        setDashboard(data);
        setProfileForm({
          name: data?.account?.name ?? auth.user?.name ?? "",
          phone: canonicalizePhoneNumber(data?.account?.phone ?? auth.user?.phone ?? ""),
          pan: data?.profile?.pan ?? "",
          dob: data?.profile?.dob ? String(data.profile.dob).slice(0, 10) : "",
          salary: data?.profile?.salary !== undefined ? String(data.profile.salary) : "",
          employmentMode: data?.profile?.employmentMode ?? "Salaried",
          address: data?.profile?.address ?? "",
          city: data?.profile?.city ?? "",
          state: data?.profile?.state ?? "",
          pincode: data?.profile?.pincode ?? "",
        });
      })
      .catch((error: any) => {
        if (!active) return;
        const message = error.response?.data?.message ?? "Unable to load borrower profile";
        setLoadingError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [auth.user?.name, auth.user?.phone]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const parsedProfile = profileUpdateSchema.safeParse({
        ...profileForm,
        phone: canonicalizePhoneNumber(profileForm.phone),
        salary: profileForm.salary,
      });

      if (!parsedProfile.success) {
        const firstFieldError = Object.values(parsedProfile.error.flatten().fieldErrors).flat().find(Boolean) ?? "Please complete all profile fields";
        throw new Error(firstFieldError);
      }

      await api.post("/borrower/profile", parsedProfile.data);
      const meResponse = await api.get("/auth/me");
      const currentUser = meResponse.data.data?.user;
      if (currentUser) {
        auth.setAuth(currentUser, auth.token);
      }
      const response = await api.get("/borrower/dashboard");
      setDashboard(response.data.data ?? null);
      toast.success("Profile saved successfully");
    } catch (error: any) {
      const message = error.response?.data?.message ?? error.message ?? "Unable to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const loans = dashboard?.loans ?? [];
  const summary = dashboard?.summary ?? { totalApplications: 0, pending: 0, withdrawn: 0, approved: 0, disbursed: 0, rejected: 0, closed: 0, appliedValue: 0 };
  const activeCount = summary.pending + summary.approved + summary.disbursed;
  const latestLoan = loans[0] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.9),rgba(16,185,129,0.78))] text-white shadow-soft">
            <CardContent className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Borrower profile
                </div>
                <h1 className="mt-5 text-3xl font-semibold md:text-5xl">Keep your borrower record current and BRE-ready.</h1>
                <p className="mt-4 max-w-2xl text-sm text-white/80 md:text-base">
                  Update identity details, maintain a verified contact profile, and keep the backend in sync with your current financial information.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-white/90">
                    <Link href="/borrower">
                      Back to dashboard
                      <BadgeIndianRupee className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button type="button" variant="outline" className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10" onClick={saveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Applications", value: summary.totalApplications.toString() },
                  { label: "Active", value: activeCount.toString() },
                  { label: "Rejected", value: summary.rejected.toString() },
                  { label: "Applied Value", value: `₹${summary.appliedValue.toLocaleString()}` },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/60">{card.label}</p>
                    <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-card/90 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle>Borrower guidance</CardTitle>
              <CardDescription>Small operational habits that improve the quality of every application.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {guidanceCards.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.title} className="flex gap-3 rounded-2xl border bg-secondary/30 p-4">
                    <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{rule.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Profile editor</CardTitle>
              <CardDescription>Change your borrower profile details and save them to the backend.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                </div>
              ) : loadingError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-700">{loadingError}</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Registered Email</label>
                    <Input value={dashboard?.account?.email ?? auth.user?.email ?? ""} readOnly className="bg-secondary/40" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Role</label>
                    <Input value={dashboard?.account?.role ?? "BORROWER"} readOnly className="bg-secondary/40" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      value={profileForm.phone}
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">PAN Number</label>
                    <Input value={profileForm.pan} onChange={(event) => setProfileForm((current) => ({ ...current, pan: event.target.value }))} placeholder="ABCDE1234F" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input type="date" value={profileForm.dob} onChange={(event) => setProfileForm((current) => ({ ...current, dob: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Monthly Salary</label>
                    <Input type="number" value={profileForm.salary} onChange={(event) => setProfileForm((current) => ({ ...current, salary: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Employment Mode</label>
                    <Select value={profileForm.employmentMode} onChange={(event) => setProfileForm((current) => ({ ...current, employmentMode: event.target.value }))}>
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Unemployed">Unemployed</option>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Textarea value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">City</label>
                    <Input value={profileForm.city} onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">State</label>
                    <Input value={profileForm.state} onChange={(event) => setProfileForm((current) => ({ ...current, state: event.target.value }))} />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <label className="text-sm font-medium">Pincode</label>
                    <Input value={profileForm.pincode} onChange={(event) => setProfileForm((current) => ({ ...current, pincode: event.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
                    <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    <Button variant="outline" asChild>
                      <Link href="/borrower">Cancel</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Live snapshot</CardTitle>
              <CardDescription>What the backend currently sees for this borrower.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Current status</p>
                <p className="mt-2 text-lg font-medium">{latestLoan ? statusLabel(latestLoan.status) : "No submissions yet"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Latest application date</p>
                <p className="mt-2 text-lg font-medium">{latestLoan ? new Date(latestLoan.createdAt).toLocaleString() : "-"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Latest due date</p>
                <p className="mt-2 text-lg font-medium">{latestLoan?.dueDate ? new Date(latestLoan.dueDate).toLocaleDateString() : "-"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Documents uploaded</p>
                <p className="mt-2 text-lg font-medium">{dashboard?.documents.length ?? 0} file{(dashboard?.documents.length ?? 0) === 1 ? "" : "s"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Payment records</p>
                <p className="mt-2 text-lg font-medium">{dashboard?.payments.length ?? 0} entry{(dashboard?.payments.length ?? 0) === 1 ? "" : "ies"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Verified contact</p>
                <p className="mt-2 text-lg font-medium">{dashboard?.account?.phoneVerifiedAt ? "Phone verified" : "Phone pending verification"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
