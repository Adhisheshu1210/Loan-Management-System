"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { AdminProfile, SectionCard } from "@/components/dashboard/admin-dashboard-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const auth = useAuthStore();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.get("/admin/dashboard/profile")
      .then((response) => {
        if (!active) return;
        const nextProfile = response.data.data ?? null;
        setProfile(nextProfile);
        setName(nextProfile?.name ?? "");
        setPhone(nextProfile?.phone ?? "");
        setSecondaryEmail(nextProfile?.secondaryEmail ?? "");
      })
      .catch((caughtError: any) => {
        if (!active) return;
        setError(caughtError.response?.data?.message ?? "Unable to load admin profile");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const response = await api.patch("/admin/dashboard/profile", {
        name: name.trim(),
        phone: phone.trim(),
        secondaryEmail: secondaryEmail.trim() || null,
      });
      const updatedProfile = response.data.data ?? null;
      setProfile(updatedProfile);
      setName(updatedProfile?.name ?? "");
      setPhone(updatedProfile?.phone ?? "");
      setSecondaryEmail(updatedProfile?.secondaryEmail ?? "");
      if (auth.user) {
        auth.setAuth(
          {
            ...auth.user,
            name: updatedProfile?.name ?? auth.user.name,
            phone: updatedProfile?.phone ?? auth.user.phone,
            phoneVerifiedAt: updatedProfile?.phoneVerifiedAt ?? null,
          },
          auth.token,
        );
      }
      toast.success("Profile updated");
    } catch (caughtError: any) {
      toast.error(caughtError.response?.data?.message ?? "Unable to update admin profile");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName(profile?.name ?? "");
    setPhone(profile?.phone ?? "");
    setSecondaryEmail(profile?.secondaryEmail ?? "");
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Profile</p>
          <h2 className="mt-2 text-3xl font-semibold">Administrator profile</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">View the signed-in admin account and verification state from the backend.</p>
        </div>
      </SectionCard>

      <Card className="bg-card/85">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Update the admin display name and secondary email from the backend.</CardDescription>
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
                  <Label htmlFor="admin-name">Display name</Label>
                  <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Admin name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondary-email">Secondary email</Label>
                  <Input id="secondary-email" type="email" value={secondaryEmail} onChange={(event) => setSecondaryEmail(event.target.value)} placeholder="optional@company.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-phone">Phone number</Label>
                  <Input id="admin-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter phone number" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Reset</Button>
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
            <div className="rounded-2xl border border-dashed p-4 text-muted-foreground">No admin profile loaded.</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/85">
        <CardHeader>
          <CardTitle>Security notes</CardTitle>
          <CardDescription>Keep access controlled from the shared profile menu and sign out when finished.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/dashboard/overview">Back to overview</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}