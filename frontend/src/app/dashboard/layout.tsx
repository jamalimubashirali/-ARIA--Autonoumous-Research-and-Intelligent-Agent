import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
