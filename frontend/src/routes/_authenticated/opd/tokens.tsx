import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { appointments, findPatient, doctors } from "@/lib/mock-data";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/opd/tokens")({ component: Page });

function Page() {
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const tokens = appointments.filter((a) => a.doctorId === doctorId).slice(0, 12);

  return (
    <>
      <PageHeader title="Token Display" description="Public-facing token display board.">
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-3xl gradient-primary p-8 text-white text-center shadow-elegant">
          <div className="text-sm uppercase tracking-widest opacity-80">Now Serving</div>
          <motion.div
            key={tokens[0]?.token}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-bold tabular-nums my-4"
          >
            #{tokens[0]?.token ?? "—"}
          </motion.div>
          <div className="text-lg">{findPatient(tokens[0]?.patientId ?? "")?.name ?? "—"}</div>
          <div className="text-xs opacity-70 mt-1">{doctors.find((d) => d.id === doctorId)?.department}</div>
        </div>

        <div className="lg:col-span-2 rounded-3xl bg-card border border-border p-6 shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Up Next</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {tokens.slice(1).map((t) => (
              <div key={t.id} className="aspect-square rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center hover:border-secondary transition-colors">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Token</div>
                <div className="text-2xl font-bold tabular-nums">#{t.token}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{t.time}</div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4">Call Next</Button>
        </div>
      </div>
    </>
  );
}
