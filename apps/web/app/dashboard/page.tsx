"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await api.get("/auth/me");
        const user = response.data?.data?.user;
        if (!mounted) return;
        if (!user) {
          router.replace("/login");
          return;
        }

        const nextRoute =
          user.role === "ADMIN"
            ? "/dashboard/overview"
            : user.role === "BORROWER"
              ? "/borrower"
              : user.role === "SALES"
                ? "/sales"
                : user.role === "SANCTION"
                  ? "/sanction"
                  : user.role === "DISBURSEMENT"
                    ? "/disbursement"
                    : user.role === "COLLECTION"
                      ? "/collection"
                      : "/unauthorized";

        router.replace(nextRoute);
      } catch {
        router.replace("/login");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return <div className="p-6">Redirecting based on your role...</div>;
}
