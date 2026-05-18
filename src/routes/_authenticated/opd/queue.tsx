import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { appointments, doctors, findPatient } from "@/lib/mock-data";
import { Clock, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/opd/queue")({
  component: Page,
});

function Page() {
  // group today's appointments by doctor
  const lanes = doctors.slice(0, 6).map((d) => ({
    doctor: d,
    items: appointments.filter((a) => a.doctorId === d.id).slice(0, 5),
  }));

  return (
    <>
      <PageHeader title="Waiting Area" description="Live token queue across all doctors.">
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Real-time
        </Badge>
      </PageHeader>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lanes.map((lane, li) => {
          const current = lane.items.find((i) => i.status === "In Consultation");
          const waiting = lane.items.filter((i) => i.status === "Scheduled" || i.status === "Checked In");
          return (
            <motion.div
              key={lane.doctor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: li * 0.04 }}
              className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden"
            >
              <div className="p-4 gradient-primary text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{lane.doctor.name}</div>
                    <div className="text-xs opacity-80">{lane.doctor.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-80">Waiting</div>
                    <div className="text-2xl font-semibold">{waiting.length}</div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {current && (
                  <div className="rounded-xl gradient-teal text-white p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-80">Now Serving</div>
                      <div className="font-medium">{findPatient(current.patientId)?.name}</div>
                    </div>
                    <div className="text-3xl font-bold">#{current.token}</div>
                  </div>
                )}
                {waiting.length > 0 ? (
                  <div className="space-y-1.5">
                    {waiting.map((a, i) => (
                      <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
                        <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-xs font-mono font-semibold">
                          #{a.token}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{findPatient(a.patientId)?.name}</div>
                          <div className="text-xs text-muted-foreground">{a.time}</div>
                        </div>
                        {i === 0 && <ArrowRight className="h-4 w-4 text-secondary" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    <Clock className="h-6 w-6 mx-auto mb-1 opacity-40" /> No one in queue
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

export const _u = Users;
