import { AuthShell } from "@/components/auth/auth-shell";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Reset Access" title="Forgot password" description="Generate a secure password reset link for your account.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
