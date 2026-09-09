import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Pill,
  TestTube,
  BedDouble,
  Receipt,
  UserCog,
  Settings,
  Activity,
} from "lucide-react";
import { searchPatients, type Patient } from "@/lib/mock-data";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPatientSelect: (p: Patient) => void;
}

const nav = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", to: "/analytics", icon: Activity },
  { label: "Appointments", to: "/opd/appointments", icon: CalendarDays },
  { label: "OPD Registration", to: "/opd/registration", icon: Users },
  { label: "Bed Management", to: "/ipd/beds", icon: BedDouble },
  { label: "Pharmacy Inventory", to: "/pharmacy/inventory", icon: Pill },
  { label: "Lab Booking", to: "/lab/booking", icon: TestTube },
  { label: "OPD Billing", to: "/billing/opd", icon: Receipt },
  { label: "Staff", to: "/hr/staff", icon: UserCog },
  { label: "Settings", to: "/settings/users", icon: Settings },
];

export function CommandPalette({ open, onOpenChange, onPatientSelect }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const patients = searchPatients(q);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder="Type a command, search patient or page…"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {patients.length > 0 && (
          <>
            <CommandGroup heading="Patients">
              {patients.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => {
                    onPatientSelect(p);
                    onOpenChange(false);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.uhid}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Navigation">
          {nav.map((n) => (
            <CommandItem
              key={n.to}
              onSelect={() => {
                navigate({ to: n.to });
                onOpenChange(false);
              }}
            >
              <n.icon className="mr-2 h-4 w-4" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
