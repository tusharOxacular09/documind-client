import { DashboardSession } from "@/components/auth/dashboard-session";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSession>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardSession>
  );
}
