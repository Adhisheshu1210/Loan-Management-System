"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-soft">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-4 text-sm text-muted-foreground">An unexpected error occurred while loading the LMS experience.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={reset}>Try again</Button>
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
