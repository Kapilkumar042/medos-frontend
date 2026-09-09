import { useEffect, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { PatientDrawer } from "@/components/shared/PatientDrawer";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/mock-data";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const theme = useUIStore((s) => s.theme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-sidebar border-sidebar-border">
          <div className="md:hidden h-full">
            <div className="[&>aside]:!flex [&>aside]:!relative [&>aside]:!w-full [&>aside]:!h-full">
              <Sidebar />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className={cn("transition-all duration-300", collapsed ? "md:pl-[72px]" : "md:pl-[260px]")}>
        <TopNavbar
          onMenu={() => setMobileOpen(true)}
          onPatientSelect={setPatient}
          onCommandOpen={() => setCmdOpen(true)}
        />
        <main className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>

      <PatientDrawer patient={patient} onClose={() => setPatient(null)} />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onPatientSelect={setPatient} />
    </div>
  );
}
