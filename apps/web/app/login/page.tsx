"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
  otp: z.string().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState<1 | 2>(1);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const handledStatus = useRef<string | null>(null);

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status || handledStatus.current === status) return;

    handledStatus.current = status;
    if (status === "account-created") {
      toast.success("Account created. Please sign in.");
    } else if (status === "reset-sent") {
      toast.success("Reset link sent. Check your email.");
    } else if (status === "password-updated") {
      toast.success("Password updated. Sign in with your new password.");
    }

    router.replace("/login");
  }, [router, searchParams]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (step === 1) {
        const response = await api.post("/auth/login", values);
        const data = response.data.data;
        if (data?.requiresOtp) {
          setChallengeId(data.challengeId);
          setOtpEmail(data.email ?? "");
          setStep(2);
          toast.success(`OTP sent to ${data.email ?? "your email"}`);
          return;
        }
      }

      if (!challengeId) {
        toast.error("Please request an OTP first");
        return;
      }

      const response = await api.post("/auth/login", { ...values, challengeId });
      const user = response.data.data?.user;
      const accessToken = response.data.data?.accessToken ?? null;
      setAuth(user, accessToken);
      toast.success("Logged in successfully");
      const nextRoute =
        user?.role === "BORROWER"
          ? "/borrower"
          : user?.role === "ADMIN"
            ? "/dashboard/overview"
            : user?.role === "SALES"
              ? "/sales"
              : user?.role === "SANCTION"
                ? "/sanction"
                : user?.role === "DISBURSEMENT"
                  ? "/disbursement"
                  : user?.role === "COLLECTION"
                    ? "/collection"
                    : "/unauthorized";
      router.push(nextRoute);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Login failed");
    }
  });

  return (
    <AuthShell eyebrow="Executive Access" title="Welcome back" description="Sign in to manage borrowers, loans, and collections from one place.">
      {!mounted ? (
        <div className="grid gap-4">
          <div className="h-6 w-40 rounded-full bg-muted/70" />
          <div className="h-12 rounded-xl bg-muted/50" />
          <div className="h-12 rounded-xl bg-muted/50" />
          <div className="h-4 w-36 rounded-full bg-muted/70" />
          <div className="h-11 rounded-xl bg-muted/50" />
        </div>
      ) : (
        <form className="grid gap-5" onSubmit={onSubmit}>
        <div className="flex items-center gap-2">
          <Badge className={step === 1 ? "bg-primary text-primary-foreground" : "bg-secondary"}>1. Credentials</Badge>
          <Badge className={step === 2 ? "bg-primary text-primary-foreground" : "bg-secondary"}>2. Verify OTP</Badge>
        </div>

        {step === 1 ? (
          <>
            <div className="grid gap-2">
              <Label>Email or Phone</Label>
              <Input {...form.register("identifier")} placeholder="name@company.com or 10-digit phone" />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} placeholder="Enter your password" />
            </div>
          </>
        ) : (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">We sent a 6-digit code to {otpEmail || "your registered email"}.</p>
              <div className="grid gap-2">
                <Label>OTP</Label>
                <Input inputMode="numeric" maxLength={6} placeholder="123456" {...form.register("otp")} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <a href="/forgot-password" className="font-medium text-primary transition hover:opacity-80">Forgot password?</a>
          <a href="/register" className="hover:text-foreground">Create account</a>
        </div>

        <div className="flex gap-3">
          {step === 2 ? (
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
          ) : null}
          <Button type="submit" className="flex-1">
            {step === 1 ? "Send OTP" : "Verify and Login"}
          </Button>
        </div>
        </form>
      )}
    </AuthShell>
  );
}
