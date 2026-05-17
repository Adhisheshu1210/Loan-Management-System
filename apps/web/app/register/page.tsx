"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { phoneNumberSchema } from "@shared/phone";

const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email").refine((s) => s.toLowerCase().endsWith("@gmail.com"), { message: "Email must end with @gmail.com" }),
  phone: phoneNumberSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(strongPasswordRegex, "Password must include uppercase, lowercase, number, and symbol"),
  role: z.enum(["BORROWER", "ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"]).default("BORROWER"),
  otp: z.string().optional(),
});

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState<1 | 2>(1);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { role: "BORROWER" },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (step === 1) {
        const response = await api.post("/auth/register", {
          ...values,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
        });
        const data = response.data.data;
        // If backend requires OTP, move to step 2. Otherwise finish registration.
        if (data?.requiresOtp && data.challengeId) {
          setChallengeId(data.challengeId);
          setOtpEmail(data.email ?? values.email);
          setStep(2);
          toast.success(`OTP sent to ${data.email ?? values.email}`);
          return;
        }

        // No OTP required — backend created the account immediately.
        const user = data?.user;
        const accessToken = data?.accessToken ?? null;
        if (user) {
          setAuth(user, accessToken);
          toast.success("Account created");
          router.push("/login?status=account-created");
          return;
        }

        throw new Error("OTP challenge was not created");
      }

      if (!challengeId) {
        toast.error("Please request an OTP first");
        return;
      }

      const response = await api.post("/auth/register", {
        ...values,
        challengeId,
        otp: values.otp?.trim(),
      });
      const user = response.data.data?.user;
      const accessToken = response.data.data?.accessToken ?? null;
      setAuth(user, accessToken);
      toast.success("Account created");
      router.push("/login?status=account-created");
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors?.fieldErrors;
      const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat().find(Boolean) : null;
      toast.error(firstFieldError ?? error.response?.data?.message ?? error.message ?? "Registration failed");
    }
  });

  return (
    <AuthShell eyebrow="Join LMS" title="Create your account" description="Set up secure access for borrowers and internal teams.">
      {!mounted ? (
        <div className="grid gap-4">
          <div className="h-6 w-44 rounded-full bg-muted/70" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-12 rounded-xl bg-muted/50" />
            <div className="h-12 rounded-xl bg-muted/50" />
          </div>
          <div className="h-12 rounded-xl bg-muted/50" />
          <div className="h-12 rounded-xl bg-muted/50" />
          <div className="h-11 rounded-xl bg-muted/50" />
        </div>
      ) : (
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="flex items-center gap-2">
            <Badge className={step === 1 ? "bg-primary text-primary-foreground" : "bg-secondary"}>1. Profile</Badge>
            <Badge className={step === 2 ? "bg-primary text-primary-foreground" : "bg-secondary"}>2. Verify OTP</Badge>
          </div>

        {step === 1 ? (
          <>
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input {...form.register("name")} placeholder="Borrower or executive name" />
              {form.formState.errors.name ? <p className="text-xs text-destructive">{form.formState.errors.name.message}</p> : null}
            </div>
              <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" {...form.register("email")} placeholder="name@company.com" />
                {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  {...form.register("phone")}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  onInput={(e) => { const el = e.currentTarget as HTMLInputElement; el.value = el.value.replace(/\D/g, "").slice(0, 10); }}
                />
                {form.formState.errors.phone ? <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} placeholder="Use a strong password" />
              {form.formState.errors.password ? <p className="text-xs text-destructive">{form.formState.errors.password.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select {...form.register("role")}>
                <option value="BORROWER">Borrower</option>
                <option value="ADMIN">Admin</option>
                <option value="SALES">Sales</option>
                <option value="SANCTION">Sanction</option>
                <option value="DISBURSEMENT">Disbursement</option>
                <option value="COLLECTION">Collection</option>
              </Select>
            </div>
          </>
        ) : (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">We sent a 6-digit code to {otpEmail || "your email address"}.</p>
              <div className="grid gap-2">
                <Label>OTP</Label>
                <Input inputMode="numeric" maxLength={6} placeholder="123456" {...form.register("otp")} />
                  {form.formState.errors.otp ? <p className="text-xs text-destructive">{form.formState.errors.otp.message}</p> : null}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <a href="/login" className="hover:text-foreground">Already have an account?</a>
        </div>

        <div className="flex gap-3">
          {step === 2 ? (
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
          ) : null}
          <Button type="submit" className="flex-1">
            {step === 1 ? "Send OTP" : "Verify and Create Account"}
          </Button>
        </div>
        </form>
      )}
    </AuthShell>
  );
}
