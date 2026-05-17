"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquareText, User2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StatusState = {
  kind: "idle" | "success" | "error";
  message: string;
};

export function ContactQueryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusState>({ kind: "idle", message: "" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedQuery = query.trim();

    if (trimmedName.length < 2 || !trimmedEmail || trimmedQuery.length < 10) {
      setStatus({ kind: "error", message: "Please fill name, email, and a detailed query before submitting." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const response = await api.post("/public/query", {
        name: trimmedName,
        email: trimmedEmail,
        query: trimmedQuery,
      });

      const successMessage = response.data?.message ?? "Query sent successfully";
      setStatus({ kind: "success", message: successMessage });
      toast.success(successMessage);
      setName("");
      setEmail("");
      setQuery("");
    } catch (error: any) {
      const failureMessage = error.response?.data?.message ?? "Unable to send query right now";
      setStatus({ kind: "error", message: failureMessage });
      toast.error(failureMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border bg-card/80 p-6 shadow-soft backdrop-blur-xl md:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquareText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Submit a query</p>
          <h3 className="text-2xl font-semibold">Talk to our team</h3>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="landing-name">Name</Label>
          <div className="relative">
            <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="landing-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className="pl-10" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="landing-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="landing-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="landing-query">Query</Label>
          <Textarea
            id="landing-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tell us what you need help with, the product stage you're in, or any questions about loans, repayments, or onboarding."
            className="min-h-[160px]"
          />
        </div>

        <Button type="submit" size="lg" className="w-full rounded-2xl" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Sending query..." : "Submit query"}
        </Button>

        {status.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
            }`}
            role="status"
          >
            {status.message}
          </div>
        ) : null}

        <p className="text-xs leading-6 text-muted-foreground">
          Your query is emailed directly to the support inbox and you will see a success or failure message after submission.
        </p>
      </div>
    </form>
  );
}