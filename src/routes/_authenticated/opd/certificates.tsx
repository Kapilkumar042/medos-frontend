import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Award, Printer } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/opd/certificates")({ component: Page });

const types = ["Medical Fitness", "Sick Leave", "Birth Certificate", "Death Certificate", "Disability", "Vaccination"];

function Page() {
  const [type, setType] = useState(types[0]);
  return (
    <>
      <PageHeader title="Medical Certificates" description="Issue and print medical certificates.">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" /> Print
        </Button>
        <Button size="sm" className="gradient-teal text-white border-0" onClick={() => toast.success("Certificate issued")}>
          <Award className="h-4 w-4 mr-1.5" /> Issue
        </Button>
      </PageHeader>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
          <div><Label>Certificate Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Patient UHID</Label><Input placeholder="UHXXXXX" className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>From</Label><Input type="date" className="mt-1.5" /></div>
            <div><Label>To</Label><Input type="date" className="mt-1.5" /></div>
          </div>
          <div><Label>Reason / Diagnosis</Label><Textarea rows={4} className="mt-1.5" /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border-2 border-dashed border-border p-8 shadow-soft">
          <div className="text-center mb-6">
            <Award className="h-10 w-10 mx-auto text-secondary mb-2" />
            <div className="text-lg font-semibold">{type}</div>
            <div className="text-xs text-muted-foreground">MedOS Hospital</div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is to certify that <span className="font-medium text-foreground">[Patient Name]</span> (UHID: <span className="font-mono">[UHID]</span>) was examined on <span className="font-medium text-foreground">[Date]</span> and is hereby issued a <strong>{type}</strong> as per medical assessment.
          </p>
          <div className="mt-12 flex justify-end">
            <div className="text-right">
              <div className="border-t border-border pt-1 text-xs text-muted-foreground">Authorized Signature</div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
