"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
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

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(8),
  password: z.string().min(8),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      token: searchParams.get("token") ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await api.post("/auth/reset-password", values);
      toast.success(response.data.message ?? "Password updated");
      router.push("/login?status=password-updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Password reset failed");
    }
  });

  return (
    <AuthShell eyebrow="Reset Access" title="Set a new password" description="Use the secure reset token from your email to create a new password.">
      <form className="grid gap-5" onSubmit={onSubmit}>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">Secure update</Badge>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} placeholder="name@company.com" />
            </div>
            <div className="grid gap-2">
              <Label>Reset Token</Label>
              <Input {...form.register("token")} placeholder="Paste the token from email" />
            </div>
            <div className="grid gap-2">
              <Label>New Password</Label>
              <Input type="password" {...form.register("password")} placeholder="Create a new password" />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary transition hover:opacity-80">
            Back to login
          </Link>
        </div>
        <Button type="submit" className="w-full">Reset Password</Button>
      </form>
    </AuthShell>
  );
}
