import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOpdStore, type OpdPatient } from "@/store/opdStore";
import z from "zod";

const searchSchema = z.object({
  patientId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/opd/prescriptions")({
  component: Page,
  validateSearch: (s) => searchSchema.parse(s),
});

interface Med {
  id: number;
  name: string;
  dose: string;
  freq: string;
  days: string;
  notes: string;
}

interface Vitals {
  bp: string; // e.g., "120/80"
  pulse: string; // bpm
  temp: string; // °C
  respRate: string; // breaths/min
  spo2: string; // %
  weight: string; // kg
  height: string; // cm
}

function Page() {
  const search = useSearch({ from: Route.id });
  const { patients, loadPatients } = useOpdStore();
  const [selectedPatient, setSelectedPatient] = useState<OpdPatient | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [meds, setMeds] = useState<Med[]>([
    { id: 1, name: "", dose: "", freq: "1-0-1", days: "5", notes: "" },
  ]);
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [vitals, setVitals] = useState<Vitals>({
    bp: "",
    pulse: "",
    temp: "",
    respRate: "",
    spo2: "",
    weight: "",
    height: "",
  });
  const [complaints, setComplaints] = useState("");
  const [examination, setExamination] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (search.patientId) {
      const patient = patients.find((p) => p.id === search.patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [search.patientId, patients]);

  const filteredPatients = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.uhid?.toLowerCase().includes(q) ||
        p.mobile.toLowerCase().includes(q),
    );
  }, [patients, searchQ]);

  const handleSavePrescription = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }

    if (!diagnosis.trim() || meds.every((m) => !m.name)) {
      toast.error("Please add diagnosis and at least one medication");
      return;
    }

    setLoading(true);
    try {
      // TODO: Save prescription to API
      toast.success("Prescription saved successfully");
      // Reset form
      setMeds([{ id: 1, name: "", dose: "", freq: "1-0-1", days: "5", notes: "" }]);
      setDiagnosis("");
      setAdvice("");
      setComplaints("");
      setExamination("");
      setVitals({ bp: "", pulse: "", temp: "", respRate: "", spo2: "", weight: "", height: "" });
    } catch (error) {
      toast.error("Failed to save prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Prescription Builder"
        description="Compose, save, and print clinical prescriptions with vitals."
      >
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1.5" /> Templates
        </Button>
        <Button
          size="sm"
          className="gradient-blue text-white border-0"
          onClick={handleSavePrescription}
          disabled={loading || !selectedPatient}
        >
          {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          <Save className="h-4 w-4 mr-1.5" /> Save
        </Button>
      </PageHeader>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Patient Selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-4 shadow-soft h-fit"
        >
          <Label className="text-sm font-semibold">Select Patient</Label>
          <Input
            placeholder="Search by name, UHID, mobile…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="mt-2 mb-3"
          />

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredPatients.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                No patients found
              </div>
            )}
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                  selectedPatient?.id === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs opacity-75">{p.uhid ?? "—"}</div>
                <div className="text-xs opacity-75">{p.mobile}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Prescription Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border p-5 shadow-soft space-y-5"
        >
          {selectedPatient && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
              <div className="font-medium text-sm">{selectedPatient.name}</div>
              <div className="text-xs text-muted-foreground">
                {selectedPatient.gender} • {selectedPatient.bloodGroup} • DOB: {selectedPatient.dob}
              </div>
              <div className="text-xs text-muted-foreground">Contact: {selectedPatient.mobile}</div>
            </div>
          )}

          {/* Vitals Section */}
          <div>
            <Label className="font-semibold text-sm mb-3 block">Vital Signs</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">BP (systolic/diastolic)</Label>
                <Input
                  placeholder="e.g., 120/80"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Pulse (bpm)</Label>
                <Input
                  placeholder="e.g., 72"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Temperature (°C)</Label>
                <Input
                  placeholder="e.g., 37.5"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">RR (breaths/min)</Label>
                <Input
                  placeholder="e.g., 16"
                  value={vitals.respRate}
                  onChange={(e) => setVitals({ ...vitals, respRate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">SpO₂ (%)</Label>
                <Input
                  placeholder="e.g., 98"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  placeholder="e.g., 70"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Chief Complaints */}
          <div>
            <Label className="text-sm font-semibold">Chief Complaints</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
              placeholder="e.g., Fever for 3 days, cough, throat pain…"
            />
          </div>

          {/* Clinical Examination */}
          <div>
            <Label className="text-sm font-semibold">Clinical Examination</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              value={examination}
              onChange={(e) => setExamination(e.target.value)}
              placeholder="e.g., Erythematous pharynx, bilateral lymphadenopathy…"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <Label className="text-sm font-semibold">Diagnosis</Label>
            <Input
              className="mt-1.5"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g., Acute upper respiratory infection"
            />
          </div>

          {/* Medications */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-semibold">Medications</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setMeds((m) => [
                    ...m,
                    { id: Date.now(), name: "", dose: "", freq: "1-0-1", days: "5", notes: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {meds.map((m, i) => (
                <div key={m.id} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-4"
                    placeholder="Medicine name"
                    value={m.name}
                    onChange={(e) =>
                      setMeds((arr) =>
                        arr.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Dose"
                    value={m.dose}
                    onChange={(e) =>
                      setMeds((arr) =>
                        arr.map((x, idx) => (idx === i ? { ...x, dose: e.target.value } : x)),
                      )
                    }
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Frequency"
                    value={m.freq}
                    onChange={(e) =>
                      setMeds((arr) =>
                        arr.map((x, idx) => (idx === i ? { ...x, freq: e.target.value } : x)),
                      )
                    }
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Days"
                    value={m.days}
                    onChange={(e) =>
                      setMeds((arr) =>
                        arr.map((x, idx) => (idx === i ? { ...x, days: e.target.value } : x)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-2"
                    onClick={() => setMeds((arr) => arr.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Advice */}
          <div>
            <Label className="text-sm font-semibold">Advice / Follow-up</Label>
            <Textarea
              className="mt-1.5"
              rows={3}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="Drink plenty of water, rest, avoid smoking, follow-up in 7 days…"
            />
          </div>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border p-6 shadow-soft h-fit"
        >
          <div className="text-center pb-4 border-b border-border mb-4">
            <div className="font-bold tracking-tight">MedOS Hospital</div>
            <div className="text-xs text-muted-foreground">Prescription</div>
          </div>

          {selectedPatient && (
            <div className="text-xs space-y-2 mb-4 pb-4 border-b border-border">
              <div>
                <span className="font-medium">{selectedPatient.name}</span>
              </div>
              <div className="text-muted-foreground">
                {selectedPatient.gender} • {selectedPatient.bloodGroup}
              </div>
              <div className="text-muted-foreground">DOB: {selectedPatient.dob}</div>
            </div>
          )}

          {/* Vitals Display */}
          {Object.values(vitals).some((v) => v) && (
            <div className="text-xs space-y-1 mb-3 pb-3 border-b border-border">
              <div className="font-semibold text-muted-foreground uppercase">Vitals</div>
              {vitals.bp && <div>BP: {vitals.bp} mmHg</div>}
              {vitals.pulse && <div>Pulse: {vitals.pulse} bpm</div>}
              {vitals.temp && <div>Temp: {vitals.temp}°C</div>}
              {vitals.respRate && <div>RR: {vitals.respRate}/min</div>}
              {vitals.spo2 && <div>SpO₂: {vitals.spo2}%</div>}
            </div>
          )}

          {complaints && (
            <div className="text-xs mb-2">
              <span className="text-muted-foreground">CC:</span> {complaints}
            </div>
          )}

          {diagnosis && (
            <div className="text-xs mb-2">
              <span className="font-semibold">Diagnosis:</span> {diagnosis}
            </div>
          )}

          {meds.some((m) => m.name) && (
            <div className="text-xs mb-2">
              <div className="font-semibold text-muted-foreground uppercase mb-1">Rx</div>
              <ul className="space-y-1">
                {meds
                  .filter((m) => m.name)
                  .map((m) => (
                    <li key={m.id}>
                      <span className="font-medium">{m.name}</span>
                      {m.dose && ` — ${m.dose}`}{" "}
                      <span className="text-muted-foreground">
                        {m.freq} × {m.days}d
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {advice && (
            <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              {advice}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
