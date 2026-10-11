import { Activity, PhoneCall, TrendingUp, Users } from "lucide-react";

interface CrmStatsCardsProps {
  internal: number;
  external: number;
  leads: number;
  dueToday: number;
  overdue: number;
  converted: number;
}

const cards = [
  { label: "Internal", valueKey: "internal", icon: Users },
  { label: "External", valueKey: "external", icon: PhoneCall },
  { label: "Leads", valueKey: "leads", icon: TrendingUp },
  { label: "Due Today", valueKey: "dueToday", icon: Activity },
  { label: "Overdue", valueKey: "overdue", icon: Activity },
  { label: "Converted", valueKey: "converted", icon: TrendingUp },
] as const;

export function CrmStatsCards(props: CrmStatsCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(({ label, valueKey, icon: Icon }) => (
        <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{props[valueKey]}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
