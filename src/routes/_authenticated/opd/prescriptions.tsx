import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/opd/prescriptions")({ component: Page });

interface Med { id: number; name: string; dose: string; freq: string; days: string; notes: string }

function Page() {
  const [meds, setMeds] = useState<Med[]>([{ id: 1, name: "", dose: "", freq: "1-0-1", days: "5", notes: "" }]);
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");

  return (
    <>
      <PageHeader title="Prescription Builder" description="Compose, save, and print clinical prescriptions.">
        <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1.5" /> Templates</Button>
        <Button size="sm" className="gradient-teal text-white border-0" onClick={() => toast.success("Prescription saved")}>
          <Save className="h-4 w-4 mr-1.5" /> Save
        </Button>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border p-5 shadow-soft space-y-4">
          <div>
            <Label>Diagnosis</Label>
            <Input className="mt-1.5" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute upper respiratory infection" />
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <Label>Medications</Label>
              <Button type="button" size="sm" variant="outline"
                onClick={() => setMeds((m) => [...m, { id: Date.now(), name: "", dose: "", freq: "1-0-1", days: "5", notes: "" }])}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {meds.map((m, i) => (
                <div key={m.id} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-4" placeholder="Medicine" value={m.name}
                    onChange={(e) => setMeds((arr) => arr.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                  <Input className="col-span-2" placeholder="Dose" value={m.dose}
                    onChange={(e) => setMeds((arr) => arr.map((x, idx) => idx === i ? { ...x, dose: e.target.value } : x))} />
                  <Input className="col-span-2" placeholder="Freq" value={m.freq}
                    onChange={(e) => setMeds((arr) => arr.map((x, idx) => idx === i ? { ...x, freq: e.target.value } : x))} />
                  <Input className="col-span-1" placeholder="Days" value={m.days}
                    onChange={(e) => setMeds((arr) => arr.map((x, idx) => idx === i ? { ...x, days: e.target.value } : x))} />
                  <Input className="col-span-2" placeholder="Notes" value={m.notes}
                    onChange={(e) => setMeds((arr) => arr.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x))} />
                  <Button type="button" variant="ghost" size="icon" className="col-span-1"
                    onClick={() => setMeds((arr) => arr.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Advice / Follow-up</Label>
            <Textarea className="mt-1.5" rows={4} value={advice} onChange={(e) => setAdvice(e.target.value)} placeholder="Drink plenty of water, rest, follow-up in 7 days…" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border p-6 shadow-soft">
          <div className="text-center pb-4 border-b border-border">
            <div className="font-bold tracking-tight">MedOS Hospital</div>
            <div className="text-xs text-muted-foreground">Prescription</div>
          </div>
          <div className="text-sm mt-4 space-y-3">
            <div><span className="text-muted-foreground">Dx:</span> {diagnosis || "—"}</div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Rx</div>
              <ul className="space-y-1.5">
                {meds.filter((m) => m.name).map((m) => (
                  <li key={m.id} className="text-sm">
                    <span className="font-medium">{m.name}</span> {m.dose && `— ${m.dose}`} <span className="text-muted-foreground">{m.freq} × {m.days}d</span>
                  </li>
                ))}
                {meds.every((m) => !m.name) && <li className="text-xs text-muted-foreground">No medications added</li>}
              </ul>
            </div>
            {advice && <div className="text-sm text-muted-foreground">{advice}</div>}
          </div>
        </motion.div>
      </div>
    </>
  );
}
