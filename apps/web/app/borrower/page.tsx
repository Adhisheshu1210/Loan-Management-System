"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/services/api";

export default function BorrowerHomePage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    api.get("/auth/me")
      .then((response) => {
        const user = response.data.data?.user;
        if (user) {
          setAuth(user, null);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router, setAuth]);

  return <DashboardView />;
}
