"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  secondaryEmail?: string | null;
  secondaryEmailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Role = "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION";

const roleConfig: Record<Role, { title: string; eyebrow: string; description: string }> = {
  SALES: { title: "Sales profile", eyebrow: "Lead tracking", description: "Keep the executive identity and contact details current." },
  SANCTION: { title: "Sanction profile", eyebrow: "Approval review", description: "Update the person handling sanction decisions and follow-up contact information." },
  DISBURSEMENT: { title: "Disbursement profile", eyebrow: "Funds release", description: "Keep the disbursement executive account synchronized with the backend." },
  COLLECTION: { title: "Collection profile", eyebrow: "Repayment control", description: "Maintain the contact profile used for repayment operations and notifications." },
};

function roleFromPathname(pathname: string): Role {
  if (pathname.startsWith("/sanction")) return "SANCTION";
  if (pathname.startsWith("/disbursement")) return "DISBURSEMENT";
  if (pathname.startsWith("/collection")) return "COLLECTION";
  return "SALES";
}

export function ExecutiveProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");

  const role = ((auth.user?.role === "SALES" || auth.user?.role === "SANCTION" || auth.user?.role === "DISBURSEMENT" || auth.user?.role === "COLLECTION")
    ? auth.user.role
    : roleFromPathname(pathname)) as Role;
  const config = roleConfig[role];

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/dashboard/profile");
      const nextProfile = response.data.data ?? null;
      setProfile(nextProfile);
      setName(nextProfile?.name ?? "");
      setPhone(nextProfile?.phone ?? "");
      setSecondaryEmail(nextProfile?.secondaryEmail ?? "");
    } catch (caughtError: any) {
      setError(caughtError.response?.data?.message ?? "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    api.get("/auth/me")
      .then((response) => {
        const user = response.data.data?.user;
        if (user) {
          auth.setAuth(user, null);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [auth, router]);

  useEffect(() => {
    if (!mounted || !auth.user?.role) return;
    loadProfile();
  }, [auth.user?.role, mounted]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore server logout errors
    } finally {
      auth.logout();
      router.replace("/login");
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const response = await api.patch("/dashboard/profile", {
        name: name.trim(),
        phone: phone.trim(),
        secondaryEmail: secondaryEmail.trim() || null,
      });
      const updated = response.data.data ?? null;
      setProfile(updated);
      setName(updated?.name ?? "");
      setPhone(updated?.phone ?? "");
      setSecondaryEmail(updated?.secondaryEmail ?? "");
      if (auth.user) {
        auth.setAuth({ ...auth.user, name: updated?.name ?? auth.user.name, phone: updated?.phone ?? auth.user.phone, phoneVerifiedAt: updated?.phoneVerifiedAt ?? null }, auth.token);
      }
      toast.success("Profile updated");
    } catch (caughtError: any) {
      toast.error(caughtError.response?.data?.message ?? "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.96))] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">{config.eyebrow}</p>
            <h1 className="mt-1 text-lg font-semibold md:text-2xl">{config.title}</h1>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border bg-background/75 px-3 py-2 text-sm md:flex">
            <UserCircle2 className="h-4 w-4" />
            <span className="font-medium">{auth.user?.name ?? role}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="bg-background/80">
              <Link href={`/${role.toLowerCase()}`}>Back to dashboard</Link>
            </Button>
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            {loading ? (
              <div className="grid gap-3">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-rose-700">{error}</div>
            ) : profile ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="grid gap-4 rounded-2xl border bg-secondary/10 p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="executive-name">Display name</Label>
                    <Input id="executive-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="executive-secondary-email">Secondary email</Label>
                    <Input id="executive-secondary-email" type="email" value={secondaryEmail} onChange={(event) => setSecondaryEmail(event.target.value)} placeholder="optional@company.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="executive-phone">Phone number</Label>
                    <Input id="executive-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter phone number" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
                    <Button type="button" variant="outline" onClick={loadProfile} disabled={saving}>Reset</Button>
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border bg-secondary/10 p-4 text-sm">
                  <div className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3"><span className="text-muted-foreground">Email</span><span className="font-medium">{profile.email}</span></div>
                  <div className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3"><span className="text-muted-foreground">Phone</span><span className="font-medium">{profile.phone}</span></div>
                  <div className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3"><span className="text-muted-foreground">Role</span><span className="font-medium">{profile.role}</span></div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge className={profile.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-500/10 text-slate-700"}>{profile.isActive ? "Active" : "Inactive"}</Badge>
                    <Badge className="bg-blue-500/10 text-blue-700">{profile.role}</Badge>
                    <Badge className={profile.phoneVerifiedAt ? "bg-blue-500/10 text-blue-700" : "bg-slate-500/10 text-slate-700"}>{profile.phoneVerifiedAt ? "Phone verified" : "Phone verification optional"}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-muted-foreground">No profile loaded.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}