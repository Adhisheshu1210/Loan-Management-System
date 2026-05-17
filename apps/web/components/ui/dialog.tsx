"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Dialog({ open, onOpenChange, children, contentClassName }: React.PropsWithChildren<{ open: boolean; onOpenChange: (open: boolean) => void; contentClassName?: string }>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className={cn("relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border bg-background p-6 shadow-soft", contentClassName)}>
        <button className="absolute right-4 top-4 rounded-full p-2 hover:bg-secondary" onClick={() => onOpenChange(false)} aria-label="Close dialog">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-2 pr-8", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex justify-end gap-3", className)} {...props} />;
}

export function DialogConfirm({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return <Button onClick={onConfirm}>{label}</Button>;
}
