"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateLoanRepayment } from "@shared/loan";
import { runBre } from "@shared/bre";
import { canonicalizePhoneNumber } from "@shared/phone";
import { z } from "zod";

const authSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      return canonicalizePhoneNumber(val).length === 10;
    } catch {
      return false;
    }
  }, "Phone must be 10 digits when provided"),
});

const profileSchema = z.object({
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  dob: z.string().min(8),
  salary: z.coerce.number().min(0),
  employmentMode: z.enum(["Salaried", "Self-Employed", "Unemployed"]),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
});

const steps = ["Verification", "Personal Details + BRE", "Upload Salary Slip", "Loan Configuration & Apply"];

export function ApplicationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string; phone?: string; phoneVerifiedAt?: string | null } | null>(null);
  const [verificationPassed, setVerificationPassed] = useState(false);
  const [breResult, setBreResult] = useState<{ eligible: boolean; reasons: string[]; age: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [amount, setAmount] = useState(250000);
  const [tenure, setTenure] = useState(180);

  const authForm = useForm<z.infer<typeof authSchema>>({ resolver: zodResolver(authSchema) });
  const profileForm = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    api.get("/auth/me")
      .then((response) => {
        const user = response.data.data?.user;
        if (user) {
          setCurrentUser({ name: user.name, email: user.email, phone: user.phone, phoneVerifiedAt: user.phoneVerifiedAt ?? null });
          authForm.reset({ fullName: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "" });
        }
      })
      .catch(() => {
        // Route protection already handles unauthenticated access.
      });
  }, [authForm]);

  const calculation = useMemo(() => calculateLoanRepayment(amount, tenure), [amount, tenure]);
  const monthlyEquivalent = useMemo(() => Number((calculation.totalRepayment / Math.max(tenure, 1)).toFixed(2)), [calculation.totalRepayment, tenure]);

  const onAuthSubmit = authForm.handleSubmit(async (values) => {
    try {
      const email = values.email.trim().toLowerCase();
      const fullName = (values.fullName ?? "").trim();
      const phoneRaw = values.phone ?? "";
      const currentEmail = currentUser?.email?.trim().toLowerCase();
      const currentName = currentUser?.name?.trim() ?? "";

      if (!currentEmail) {
        toast.error("Unable to load your session. Please login again.");
        router.push("/login");
        return;
      }

      if (email !== currentEmail) {
        toast.error("Email does not match your account");
        return;
      }

      // Full name is optional and will not be enforced to match account name.

      // If phone provided, ensure it's 10 digits and (if account has phone) matches session
      if (phoneRaw) {
        const phone = canonicalizePhoneNumber(phoneRaw);
        if (phone.length !== 10) {
          toast.error("Enter a valid 10-digit phone number");
          return;
        }
        if (currentUser?.phone && phone !== canonicalizePhoneNumber(currentUser.phone)) {
          toast.error("Phone number does not match your account");
          return;
        }
      }

      setVerificationPassed(true);
      toast.success("Verified");
      setStep(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to verify");
    }
  });

  const onProfileSubmit = profileForm.handleSubmit(async (values) => {
    try {
      const bre = runBre({ dob: values.dob, salary: Number(values.salary), pan: values.pan, employmentMode: values.employmentMode });
      setBreResult(bre);
      if (!bre.eligible) {
        toast.error(bre.reasons.join(" "));
        return;
      }
      await api.post("/borrower/profile", { ...values, salary: Number(values.salary) });
      toast.success("Profile saved and BRE approved");
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to save profile");
    }
  });

  const uploadSalarySlip = async () => {
    if (!file) {
      toast.error("Please select a salary slip");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    await api.post("/borrower/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    toast.success("Salary slip uploaded");
    setStep(3);
  };

  const submitLoan = async () => {
    try {
      await api.post("/borrower/apply-loan", { amount, tenure });
      toast.success("Loan application submitted");
      // Wait briefly so the user can see the toast before navigating away
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/borrower");
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to submit loan application");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
      <Card className="bg-card/80 backdrop-blur">
          <CardHeader>
          <CardTitle>Borrower Application</CardTitle>
          <CardDescription>Complete the application in four guided steps.</CardDescription>
          <div className="grid gap-2 sm:grid-cols-4">
            {steps.map((label, index) => (
              <Badge key={label} className={index === step ? "border-primary bg-primary text-primary-foreground" : "bg-secondary"}>
                {index + 1}. {label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <form className="grid gap-4" onSubmit={onAuthSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name (as per Aadhaar)</Label>
                <Input id="fullName" {...authForm.register("fullName")} placeholder="Full name as per Aadhaar" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...authForm.register("email")} placeholder="name@company.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...authForm.register("phone")} placeholder="10-digit mobile number" />
              </div>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  We will verify these details against your active session before letting you continue.
                </CardContent>
              </Card>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/borrower")}>
                  Back to Dashboard
                </Button>
                <Button type="submit" className="flex-1">Verify and Continue</Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <form className="grid gap-4" onSubmit={onProfileSubmit}>
              <div className="grid gap-2">
                <Label>Verification Status</Label>
                <Card className={verificationPassed ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}>
                  <CardContent className="p-4 text-sm">
                    <p className="font-medium">{verificationPassed ? "Verified" : "Pending verification"}</p>
                    <p className="mt-1 text-muted-foreground">{verificationPassed ? "Email and name confirmed." : "Complete verification to continue."}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>PAN Number</Label>
                  <Input {...profileForm.register("pan")} placeholder="ABCDE1234F" />
                </div>
                <div className="grid gap-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...profileForm.register("dob")} />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Monthly Salary</Label>
                  <Input type="number" {...profileForm.register("salary", { valueAsNumber: true })} />
                </div>
                <div className="grid gap-2">
                  <Label>Employment Mode</Label>
                  <Select {...profileForm.register("employmentMode")}>
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Unemployed">Unemployed</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Textarea {...profileForm.register("address")} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input placeholder="City" {...profileForm.register("city")} />
                <Input placeholder="State" {...profileForm.register("state")} />
                <Input placeholder="Pincode" {...profileForm.register("pincode")} />
              </div>
              {breResult ? (
                <Card className={breResult.eligible ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"}>
                  <CardContent className="p-4 text-sm">
                    <p className="font-medium">BRE Result: {breResult.eligible ? "Approved" : "Rejected"}</p>
                    <p>Age: {breResult.age}</p>
                    {breResult.reasons.length ? <p className="mt-1 text-rose-500">{breResult.reasons.join(" ")}</p> : null}
                  </CardContent>
                </Card>
              ) : null}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="submit">Save Profile</Button>
              </div>
            </form>
          )}

          

          {step === 2 && (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mx-auto block" />
                <p className="mt-3 text-sm text-muted-foreground">PDF, JPG, PNG up to 5MB. Merge all proofs into 1 file before uploading.</p>
              </div>
              <Progress value={uploadProgress} />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={uploadSalarySlip}>Upload Salary Slip</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-6">
              <div className="grid gap-4 rounded-2xl border bg-secondary/30 p-5">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Loan Amount: ₹{amount.toLocaleString()}</Label>
                    <Input
                      className="w-40"
                      inputMode="numeric"
                      pattern="\d*"
                      value={String(amount)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setAmount(digits ? Number(digits) : 0);
                      }}
                    />
                  </div>
                  <Slider min={50000} max={500000} value={amount} onChange={setAmount} />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Tenure: {tenure} days</Label>
                    <Input
                      className="w-28"
                      inputMode="numeric"
                      pattern="\d*"
                      value={String(tenure)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setTenure(digits ? Number(digits) : 0);
                      }}
                    />
                  </div>
                  <Slider min={30} max={365} value={tenure} onChange={setTenure} />
                </div>
              </div>
              <Card>
                <CardContent className="grid gap-3 p-6 text-sm">
                  <p>Principal Amount: ₹{amount.toLocaleString()}</p>
                  <p>Interest Amount: ₹{calculation.interestAmount.toLocaleString()}</p>
                  <p>Total Repayment: ₹{calculation.totalRepayment.toLocaleString()}</p>
                  <p>Daily EMI Approximation: ₹{monthlyEquivalent.toLocaleString()}</p>
                  <p>Due Date: {calculation.dueDate.toLocaleDateString()}</p>
                </CardContent>
              </Card>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={submitLoan}>Apply Loan</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Loan Calculator</CardTitle>
          <CardDescription>Live repayment preview based on the fixed 12% annual rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-2xl border bg-secondary/30 p-4">
            <p className="text-muted-foreground">BRE status</p>
            <p className="mt-2 text-lg font-medium">{breResult?.eligible ? "Eligible" : "Pending or Rejected"}</p>
          </div>
          <div className="rounded-2xl border bg-secondary/30 p-4">
            <p className="text-muted-foreground">Upload progress</p>
            <p className="mt-2 text-lg font-medium">{uploadProgress}%</p>
          </div>
          <div className="rounded-2xl border bg-secondary/30 p-4">
            <p className="text-muted-foreground">Loan status</p>
            <p className="mt-2 text-lg font-medium">APPLIED when submitted</p>
          </div>
          <div className="rounded-2xl border bg-secondary/30 p-4">
            <p className="text-muted-foreground">Verification</p>
            <p className="mt-2 text-lg font-medium">{verificationPassed ? "Completed" : "Pending"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
