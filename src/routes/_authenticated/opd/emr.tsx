import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Activity, Thermometer, Wind, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/opd/emr")({ component: Page });

function Page() {
  const [vitals, setVitals] = useState({ bp: "120/80", pulse: "78", temp: "98.6", spo2: "98", weight: "68" });

  return (
    <>
      <PageHeader title="Patient EMR" description="Electronic Medical Records — vitals, SOAP, diagnoses.">
        <Button size="sm" className="gradient-blue text-white border-0" onClick={() => toast.success("EMR saved")}>
          <Save className="h-4 w-4 mr-1.5" /> Save Record
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { icon: Activity, label: "BP", value: vitals.bp, unit: "mmHg", color: "text-info" },
          { icon: Heart, label: "Pulse", value: vitals.pulse, unit: "bpm", color: "text-destructive" },
          { icon: Thermometer, label: "Temp", value: vitals.temp, unit: "°F", color: "text-warning" },
          { icon: Wind, label: "SpO₂", value: vitals.spo2, unit: "%", color: "text-secondary" },
          { icon: Activity, label: "Weight", value: vitals.weight, unit: "kg", color: "text-success" },
        ].map((v, i) => (
          <motion.div key={v.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-card border border-border p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><v.icon className={`h-4 w-4 ${v.color}`} /> {v.label}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <Input value={v.value} onChange={(e) => setVitals((s) => ({ ...s, [v.label.toLowerCase().replace("₂", "2")]: e.target.value }))}
                className="text-xl font-semibold border-0 p-0 h-auto bg-transparent w-full" />
              <span className="text-xs text-muted-foreground">{v.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-soft p-5">
        <Tabs defaultValue="soap">
          <TabsList>
            <TabsTrigger value="soap">SOAP Notes</TabsTrigger>
            <TabsTrigger value="dx">Diagnosis</TabsTrigger>
            <TabsTrigger value="hx">History</TabsTrigger>
            <TabsTrigger value="follow">Follow-up</TabsTrigger>
          </TabsList>
          <TabsContent value="soap" className="mt-4 grid md:grid-cols-2 gap-4">
            {[
              ["Subjective", "Patient complaints, history of present illness…"],
              ["Objective", "Examination findings, vitals…"],
              ["Assessment", "Clinical impression, differential diagnosis…"],
              ["Plan", "Treatment plan, medications, advice…"],
            ].map(([t, p]) => (
              <div key={t}>
                <Label>{t}</Label>
                <Textarea rows={5} placeholder={p} className="mt-1.5" />
              </div>
            ))}
          </TabsContent>
          <TabsContent value="dx" className="mt-4 space-y-3">
            <div><Label>Primary Diagnosis</Label><Input className="mt-1.5" placeholder="ICD-10 code or name" /></div>
            <div><Label>Secondary Diagnosis</Label><Input className="mt-1.5" /></div>
          </TabsContent>
          <TabsContent value="hx" className="mt-4 grid md:grid-cols-2 gap-4">
            <div><Label>Past History</Label><Textarea rows={4} className="mt-1.5" /></div>
            <div><Label>Family History</Label><Textarea rows={4} className="mt-1.5" /></div>
            <div><Label>Allergies</Label><Textarea rows={3} className="mt-1.5" /></div>
            <div><Label>Medications</Label><Textarea rows={3} className="mt-1.5" /></div>
          </TabsContent>
          <TabsContent value="follow" className="mt-4 grid md:grid-cols-2 gap-3">
            <div><Label>Next Visit</Label><Input type="date" className="mt-1.5" /></div>
            <div><Label>Reason</Label><Input className="mt-1.5" /></div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
