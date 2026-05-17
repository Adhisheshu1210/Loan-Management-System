import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-soft">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">The route you requested does not exist.</p>
        <Button asChild className="mt-6">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
