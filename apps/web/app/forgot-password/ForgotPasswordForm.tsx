"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await api.post("/auth/forgot-password", values);
      toast.success(response.data.message ?? "Reset link generated");
      router.push("/login?status=reset-sent");
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to send reset link");
    }
  });

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <Badge className="bg-primary text-primary-foreground">Password recovery</Badge>
      </div>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">Enter the email address associated with your account. We will send a secure reset link to that inbox.</p>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} placeholder="name@company.com" />
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <a href="/login" className="font-medium text-primary transition hover:opacity-80">Back to login</a>
      </div>
      <Button type="submit" className="w-full">Send Reset Link</Button>
    </form>
  );
}
