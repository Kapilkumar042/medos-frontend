import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  ListOrdered,
  FileText,
  Stethoscope,
  Award,
  BedDouble,
  HeartPulse,
  TestTube,
  ScanLine,
  Pill,
  Receipt,
  Wallet,
  UserCog,
  Settings,
  Building2,
  Briefcase,
  ChevronDown,
  Activity,
  Sparkles,
  QrCode,
  PhoneCall
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

interface SubItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface Group {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SubItem[];
}

const groups: Group[] = [
  // {
  //   title: "Overview",
  //   icon: LayoutDashboard,
  //   items: [
  //     { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  //     // { label: "Analytics", to: "/analytics", icon: Activity },
  //     // { label: "Reports", to: "/reports", icon: FileText },
  //   ],
  // },
 
  {
    title: "OPD",
    icon: Stethoscope,
    items: [
      { label: "Appointments", to: "/opd/appointments", icon: CalendarDays },
      { label: "Registration", to: "/opd/registration", icon: Users },
      { label: "Waiting Area", to: "/opd/queue", icon: Clock },
      // { label: "Token Queue", to: "/opd/tokens", icon: ListOrdered },
      { label: "Prescriptions", to: "/opd/prescriptions", icon: FileText },
      { label: "Patient List", to: "/opd/patients", icon: Receipt },
      { label: "Follow Up", to: "/opd/follow-up", icon: PhoneCall },
      // { label: "Patient EMR", to: "/opd/emr", icon: HeartPulse },
      // { label: "Certificates", to: "/opd/certificates", icon: Award },
    ],
  },
  {
    title: "IPD",
    icon: BedDouble,
    items: [
      { label: "Admission", to: "/ipd/admission", icon: Users },
      { label: "Patient List", to: "/ipd/patients", icon: Users },
      { label: "Bed Management", to: "/ipd/beds", icon: BedDouble },
      { label: "Discharge", to: "/ipd/discharge", icon: FileText },
      { label: "Nursing", to: "/ipd/nursing", icon: HeartPulse },
    ],
  },
  {
    title: "Laboratory",
    icon: TestTube,
    items: [
      { label: "Test Booking", to: "/lab/booking", icon: CalendarDays },
      { label: "Sample Collection", to: "/lab/samples", icon: TestTube },
      { label: "Reports", to: "/lab/reports", icon: FileText },
    ],
  },
  {
    title: "Radiology",
    icon: ScanLine,
    items: [
      { label: "X-Ray", to: "/radiology/xray", icon: ScanLine },
      { label: "MRI", to: "/radiology/mri", icon: ScanLine },
      { label: "CT Scan", to: "/radiology/ct", icon: ScanLine },
      { label: "Reports", to: "/radiology/reports", icon: FileText },
    ],
  },
  {
    title: "Pharmacy",
    icon: Pill,
    items: [
      { label: "Inventory", to: "/pharmacy/inventory", icon: Pill },
      { label: "Sales", to: "/pharmacy/sales", icon: Receipt },
      { label: "Stock", to: "/pharmacy/stock", icon: Pill },
    ],
  },
   {
    title: "Master",
    icon: UserCog,
    items: [
      { label: "Doctor Profile", to: "/master/doctor-profile", icon: Stethoscope },
      { label: "Lab Tests", to: "/master/lab-tests", icon: TestTube },
      { label: "Radiology Tests", to: "/master/radiology-tests", icon: ScanLine },
      { label: "Services", to: "/master/services", icon: Briefcase },
      { label: "Medicines", to: "/master/medicines", icon: Pill },
      { label: "Departments", to: "/master/departments", icon: Building2 },
    ],
  },
  // {
  //   title: "Billing",
  //   icon: Receipt,
  //   items: [
  //     { label: "IPD Billing", to: "/billing/ipd", icon: Receipt },
  //     { label: "Expenses", to: "/billing/expenses", icon: Wallet },
  //     { label: "Doctor Share", to: "/billing/doctor-share", icon: Wallet },
  //   ],
  // },
  // {
  //   title: "HR",
  //   icon: UserCog,
  //   items: [
  //     { label: "Staff", to: "/hr/staff", icon: Users },
  //     { label: "Attendance", to: "/hr/attendance", icon: Clock },
  //     { label: "Payroll", to: "/hr/payroll", icon: Wallet },
  //   ],
  // },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { label: "Users", to: "/settings/users", icon: Users },
      { label: "Roles", to: "/settings/roles", icon: UserCog },
      { label: "Permissions", to: "/settings/permissions", icon: Settings },
      { label: "Hospital Setup", to: "/settings/hospital", icon: Settings },
      {
        label: "Hospital QR",
        to: "/settings/hospital-qr",
        icon: QrCode,
      },
    ],
  },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const initiallyOpen = groups.reduce(
    (acc, g) => {
      acc[g.title] = g.items.some((i) => pathname.startsWith(i.to)) || g.title === "Overview";
      return acc;
    },
    {} as Record<string, boolean>,
  );
  const [open, setOpen] = useState<Record<string, boolean>>(initiallyOpen);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[200px]",
        "hidden md:flex flex-col",
      )}
    >
      <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-blue shadow-glow shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-semibold text-sidebar-foreground/80 text-[18px] tracking-[2px]">
              Ncuresoft
            </div>
            {/* <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
              Hospital Software
            </div> */}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-1">
        {groups.map((g) => {
          const isOpen = open[g.title];
          const hasActive = g.items.some(
            (i) => pathname === i.to || pathname.startsWith(i.to + "/"),
          );
          return (
            <div key={g.title}>
              <button
                onClick={() => setOpen((s) => ({ ...s, [g.title]: !s[g.title] }))}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-black",
                  hasActive && "text-sidebar-accent-foreground",
                )}
              >
                <g.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-black font-bold text-left text-xs uppercase tracking-wider opacity-75">
                      {g.title}
                    </span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                    />
                  </>
                )}
              </button>
              <AnimatePresence initial={false}>
                {(isOpen || collapsed) && (
                  <motion.ul
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-0.5 space-y-0.5"
                  >
                    {g.items.map((item) => {
                      const active = pathname === item.to || pathname.startsWith(item.to + "/");
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                              collapsed && "justify-center px-2",
                              active
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                                : "text-black hover:bg-sidebar-accent hover:text-black",
                            )}
                            title={collapsed ? item.label : undefined}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                active && "text-sidebar-primary-foreground",
                              )}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl gradient-blue p-3 text-xs text-white">
            <div className="font-semibold">Need help?</div>
            <div className="opacity-90 mt-0.5">24/7 support available</div>
          </div>
        </div>
      )}
    </aside>
  );
}
