import { AdminDashboardShell } from "@/components/dashboard/admin-dashboard-shell";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}