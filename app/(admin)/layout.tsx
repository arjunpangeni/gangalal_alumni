import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user?.role !== "admin" && session.user?.role !== "superadmin") redirect("/dashboard");

  return (
    <SessionProvider>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
