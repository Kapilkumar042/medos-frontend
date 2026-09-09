import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

import {
  getQueue,
  callToken,
  startConsultation,
  completeConsultation,
  skipToken,
} from "@/api/opdQueueApi";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { Clock, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/opd/queuew")({
  component: Page,
});
interface QueueRecord {
  id: number;
  token_no: number;
  status: string;

  opd_patient_id: number;

  patient_name?: string;
  doctor_name?: string;

  checkin_time?: string;
}
function Page() {
  const [queue, setQueue] = useState<QueueRecord[]>([]);
  const waiting = queue.filter((q) => q.status === "Waiting");

  const called = queue.filter((q) => q.status === "Called");

  const consulting = queue.filter((q) => q.status === "In Consultation");

  const loadQueue = async () => {
    try {
      const data = await getQueue();

      setQueue(data);
    } catch {
      toast.error("Failed to load queue");
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);
  return (
    <>
      <PageHeader title="Waiting Area" description="Live token queue across all doctors.">
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Real-time
        </Badge>
      </PageHeader>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Waiting Tokens</h3>

          <div className="space-y-2">
            {waiting.map((q) => (
              <div key={q.id} className="border rounded-lg p-3">
                <div className="font-semibold">Token #{q.token_no}</div>

                <div className="text-sm text-muted-foreground">{q.patient_name}</div>

                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await callToken(q.id);

                      toast.success(`Token ${q.token_no} called`);

                      loadQueue();
                    }}
                  >
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Called</h3>

          <div className="space-y-2">
            {called.map((q) => (
              <div key={q.id} className="border rounded-lg p-3">
                <div className="font-semibold">Token #{q.token_no}</div>

                <div>{q.patient_name}</div>

                <Button
                  size="sm"
                  onClick={async () => {
                    await startConsultation(q.id);

                    toast.success("Consultation started");

                    loadQueue();
                  }}
                >
                  Start Consultation
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-3">In Consultation</h3>

          <div className="space-y-2">
            {consulting.map((q) => (
              <div key={q.id} className="border rounded-lg p-3">
                <div className="font-semibold">Token #{q.token_no}</div>

                <div>{q.patient_name}</div>

                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await completeConsultation(q.id);

                      toast.success("Consultation completed");

                      loadQueue();
                    }}
                  >
                    Complete
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await skipToken(q.id);

                      toast.success("Token skipped");

                      loadQueue();
                    }}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const _u = Users;
