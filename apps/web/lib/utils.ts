import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveFileUrl(fileUrl?: string | null): string | undefined {
  if (!fileUrl) return undefined;
  try {
    const parsed = new URL(fileUrl);
    // absolute URL already
    return parsed.href;
  } catch {
    // relative path, prefix with API origin derived from NEXT_PUBLIC_API_URL
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
    const origin = api.replace(/\/api\/?$/, "");
    return `${origin}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
  }
}

export function downloadBlobAsFile(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}
