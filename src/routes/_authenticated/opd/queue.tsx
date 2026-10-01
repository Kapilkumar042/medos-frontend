import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  Users,
  ArrowRight,
  PhoneCall,
  X,
  History,
  RotateCcw,
  Ban,
  MessageCircle,
} from "lucide-react";

import {
  getQueue,
  callToken,
  startConsultation,
  completeConsultation,
  skipToken,
  requeueToken,
  cancelToken,
} from "@/api/opdQueueApi";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_authenticated/opd/queue")({
  component: Page,
});

interface QueueRecord {
  id: number;
  token_no: number;
  status: string; // "Waiting" | "Called" | "In Consultation" | "Completed" | "Skipped"
  doctor_id: number | null;
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
    specialization: string;
  } | null;
  opd_patient_id: number;
  patient: {
    id: number;
    name: string;
    uhid: string;
    mobile?: string | null;
  };
}

const UNASSIGNED = "unassigned";

function Page() {
  const hospitalName = useAuthStore((state) => state.hospital?.name ?? "Hospital");
  const [queue, setQueue] = useState<QueueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadQueue = async () => {
    try {
      const data = await getQueue();
      setQueue(data);
    } catch {
      toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000); // light polling for "real-time" feel
    return () => clearInterval(interval);
  }, []);

  // only active tokens belong on the board; drop completed/skipped/cancelled ones
  const active = queue.filter(
    (q) => q.status !== "Completed" && q.status !== "Skipped" && q.status !== "Cancelled",
  );

  const skipped = queue.filter((q) => q.status === "Skipped");
  const cancelled = queue.filter((q) => q.status === "Cancelled");
  const completed = queue.filter((q) => q.status === "Completed");
  const history = [...skipped, ...cancelled, ...completed];

  // group by doctor_id, falling back to an "Unassigned" lane
  const laneKeys = Array.from(
    new Set(active.map((q) => (q.doctor_id != null ? String(q.doctor_id) : UNASSIGNED))),
  );

  const lanes = laneKeys.map((key) => {
    const items = active.filter((q) =>
      key === UNASSIGNED ? q.doctor_id == null : String(q.doctor_id) === key,
    );
    const doctor = items.find((i) => i.doctor)?.doctor ?? null;
    return {
      key,
      label: doctor ? `${doctor.first_name} ${doctor.last_name}` : "Unassigned",
      specialization: doctor?.specialization,
      items,
    };
  });

  const doctorLabel = (q: QueueRecord) =>
    q.doctor ? `${q.doctor.first_name} ${q.doctor.last_name}` : "Unassigned";

  const handleRequeue = async (q: QueueRecord) => {
    try {
      await requeueToken(q.id);
      toast.success(`Token ${q.token_no} added back to queue`, {
  duration: 500,
});
      loadQueue();
    } catch {
      toast.error("Failed to requeue token");
    }
  };

  const handleCancel = async (q: QueueRecord) => {
    try {
      await cancelToken(q.id);
      toast.success(`Token ${q.token_no} cancelled`, {
  duration: 500,
});
      loadQueue();
    } catch {
      toast.error("Failed to cancel token");
    }
  };

  const normalizeWhatsAppNumber = (value?: string | null) => {
    const digits = String(value ?? "").replace(/\D/g, "");

    if (digits.length === 10) {
      return `91${digits}`;
    }

    if (digits.startsWith("0") && digits.length === 11) {
      return `91${digits.slice(1)}`;
    }

    return digits;
  };

  const sendQueueStatusOnWhatsApp = (record: QueueRecord) => {
    const phone = normalizeWhatsAppNumber(record.patient.mobile);

    if (!phone || phone.length < 12) {
      toast.error("Patient WhatsApp number is missing or invalid");
      return;
    }

    const doctorName = record.doctor
      ? `Dr. ${record.doctor.first_name} ${record.doctor.last_name}`
      : "the doctor";

    const statusMessages: Record<string, string> = {
      Waiting: "You are currently waiting for your consultation.",
      Called: "Your token has been called. Please proceed to the consultation area.",
      "In Consultation": "Your consultation is currently in progress.",
      Completed: "Your consultation has been completed. Thank you for visiting.",
      Skipped: "Your token was skipped. Please contact the reception desk.",
      Cancelled: "Your queue token has been cancelled. Please contact the reception desk.",
    };

    const statusMessage =
      statusMessages[record.status] ?? `Your current queue status is: ${record.status}.`;

    const message = `Dear ${record.patient.name},

This is an update from ${hospitalName} regarding your OPD queue.

Token Number: #${record.token_no}
UHID: ${record.patient.uhid}
Doctor: ${doctorName}
Status: ${record.status}

${statusMessage}

Please contact the reception desk if you need any help.

Take care,
${hospitalName}`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <PageHeader title="Waiting Area" description="Live token queue across all doctors.">
        <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
          <History className="h-4 w-4 mr-1.5" /> History
        </Button>
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Real-time
        </Badge>
      </PageHeader>

      {!loading && lanes.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-12">
          No patients in queue right now.
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lanes.map((lane, li) => {
          const current = lane.items.find((i) => i.status === "In Consultation");
          const called = lane.items.filter((i) => i.status === "Called");
          const waiting = lane.items.filter((i) => i.status === "Waiting");
          const upNext = [...called, ...waiting];

          return (
            <motion.div
              key={lane.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: li * 0.04 }}
              className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden"
            >
              <div className="p-4 gradient-primary text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{lane.label}</div>
                    {lane.specialization && (
                      <div className="text-xs opacity-80">{lane.specialization}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-80">Waiting</div>
                    <div className="text-2xl font-semibold">{upNext.length}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {current && (
                  <div className="rounded-xl gradient-teal text-white p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-80">
                        Now Serving
                      </div>
                      <div className="font-medium">{current.patient.name}</div>
                      <div className="text-[10px] opacity-70">{current.patient.uhid}</div>
                    </div>
                    <div className="text-3xl font-bold">#{current.token_no}</div>
                  </div>
                )}

                {/* {current && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          await completeConsultation(current.id);
                          toast.success(`Token ${current.token_no} completed`);
                          loadQueue();
                        } catch {
                          toast.error("Failed to complete consultation");
                        }
                      }}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Skip token"
                      onClick={async () => {
                        try {
                          await skipToken(current.id);
                          toast.success(`Token ${current.token_no} skipped`);
                          loadQueue();
                        } catch {
                          toast.error("Failed to skip token");
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Cancel token"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancel(current)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )} */}

                {current && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-success/40 text-success hover:bg-success/10"
                      title="Send queue status on WhatsApp"
                      onClick={() => sendQueueStatusOnWhatsApp(current)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>

                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          await completeConsultation(current.id);
                          toast.success(`Token ${current.token_no} completed`, {
  duration: 500,
});
                          loadQueue();
                        } catch {
                          toast.error("Failed to complete consultation");
                        }
                      }}
                    >
                      Complete
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      title="Skip token"
                      onClick={async () => {
                        try {
                          await skipToken(current.id);
                          toast.success(`Token ${current.token_no} skipped`, {
  duration: 500,
});
                          loadQueue();
                        } catch {
                          toast.error("Failed to skip token");
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      title="Cancel token"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancel(current)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {upNext.length > 0 ? (
                  <div className="space-y-1.5">
                    {upNext.map((a, i) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40"
                      >
                        <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-xs font-mono font-semibold">
                          #{a.token_no}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{a.patient.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.status === "Called" ? "Called" : "Waiting"}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {a.status === "Waiting" ? (
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-warning/40 text-warning hover:bg-warning/10"
                              title="Call token"
                              onClick={async () => {
                                try {
                                  await callToken(a.id);
                                  toast.success(`Token ${a.token_no} called`, {
  duration: 500,
});
                                  loadQueue();
                                } catch {
                                  toast.error("Failed to call token");
                                }
                              }}
                            >
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="outline"
                              // className="h-8 w-8 border-secondary/40 text-secondary hover:bg-secondary/10"
                              title="Start consultation"
                              onClick={async () => {
                                try {
                                  await startConsultation(a.id);
                                  toast.success(`Consultation started for ${a.patient.name}`, {
  duration: 500,
});
                                  loadQueue();
                                } catch {
                                  toast.error("Failed to start consultation");
                                }
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                            title="Cancel token"
                            onClick={() => handleCancel(a)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !current && (
                    <div className="text-center text-xs text-muted-foreground py-6">
                      <Clock className="h-6 w-6 mx-auto mb-1 opacity-40" /> No one in queue
                    </div>
                  )
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Skipped & Completed history modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Skipped, Cancelled & Completed</DialogTitle>
          </DialogHeader>

          {history.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No skipped or completed tokens yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-xs">#{q.token_no}</TableCell>
                    <TableCell>
                      <div className="font-medium">{q.patient.name}</div>
                      <div className="text-xs text-muted-foreground">{q.patient.uhid}</div>
                    </TableCell>
                    <TableCell>{doctorLabel(q)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          q.status === "Skipped"
                            ? "border-warning text-warning"
                            : q.status === "Cancelled"
                              ? "border-destructive text-destructive"
                              : "border-success text-success"
                        }
                      >
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {q.status === "Skipped" ? (
                        <Button size="sm" variant="outline" onClick={() => handleRequeue(q)}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Requeue
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export const _u = Users;
