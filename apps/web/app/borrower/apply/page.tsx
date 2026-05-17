import Link from "next/link";
import { ApplicationWizard } from "@/components/borrower/application-wizard";

export default function BorrowerApplyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <Link href="/borrower" className="text-sm font-medium uppercase tracking-[0.3em] text-primary transition hover:opacity-80">
          Borrower Flow
        </Link>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Apply for a loan</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Verify your email and phone number, then complete BRE-validated profile submission, salary slip upload, and live loan configuration in one guided flow.</p>
      </div>
      <ApplicationWizard />
    </div>
  );
}
