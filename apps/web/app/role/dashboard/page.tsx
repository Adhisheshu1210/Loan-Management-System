"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export default function RoleDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const user = res.data?.data?.user;
        if (!mounted) return;
        if (!user) {
          router.replace("/login");
          return;
        }
        const role = user.role;
        if (role === "ADMIN") {
          router.replace("/dashboard/overview");
        } else if (role === "BORROWER") {
          router.replace("/borrower");
        } else if (role === "SALES") {
          router.replace("/sales");
        } else if (role === "SANCTION") {
          router.replace("/sanction");
        } else if (role === "DISBURSEMENT") {
          router.replace("/disbursement");
        } else if (role === "COLLECTION") {
          router.replace("/collection");
        } else {
          router.replace("/unauthorized");
        }
      } catch (err) {
        router.replace("/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  return <div className="p-6">Redirecting based on role…</div>;
}
