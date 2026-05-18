import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { beds, findPatient, type Bed } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { BedDouble } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ipd/beds")({ component: Page });

const wardOptions = ["All", "ICU", "General", "Private", "Semi-Private", "Pediatric", "Maternity"] as const;
const statusColors: Record<Bed["status"], string> = {
  Available: "bg-success text-success-foreground",
  Occupied: "bg-destructive text-destructive-foreground",
  Cleaning: "bg-warning text-warning-foreground",
  Reserved: "bg-info text-info-foreground",
};

function Page() {
  const [ward, setWard] = useState<typeof wardOptions[number]>("All");
  const filtered = ward === "All" ? beds : beds.filter((b) => b.ward === ward);
  const stats = (["Available", "Occupied", "Cleaning", "Reserved"] as const).map((s) => ({
    s, n: filtered.filter((b) => b.status === s).length,
  }));

  return (
    <>
      <PageHeader title="Bed Management" description="Real-time view of ward and bed status.">
        {(["Available", "Occupied", "Cleaning", "Reserved"] as const).map((s) => (
          <Badge key={s} variant="outline" className="gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", statusColors[s])} /> {s}
          </Badge>
        ))}
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {stats.map((st, i) => (
          <motion.div key={st.s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-2xl bg-card border border-border p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{st.s}</div>
                <div className="text-2xl font-semibold mt-1">{st.n}</div>
              </div>
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", statusColors[st.s])}>
                <BedDouble className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs value={ward} onValueChange={(v) => setWard(v as any)}>
        <TabsList className="flex-wrap h-auto">
          {wardOptions.map((w) => <TabsTrigger key={w} value={w}>{w}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-4">
        {filtered.map((b, i) => {
          const p = b.patientId ? findPatient(b.patientId) : null;
          return (
            <motion.button
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              onClick={() => toast.info(`${b.number} • ${b.status}${p ? ` • ${p.name}` : ""}`)}
              className="aspect-square rounded-2xl border border-border bg-card hover:shadow-elegant transition-all p-2 flex flex-col items-center justify-center text-center"
            >
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-1", statusColors[b.status])}>
                <BedDouble className="h-4 w-4" />
              </div>
              <div className="text-xs font-mono font-semibold">{b.number}</div>
              <div className="text-[9px] text-muted-foreground truncate w-full">{p ? p.name : b.ward}</div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

export const _u = Button;
