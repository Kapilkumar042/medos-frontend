import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Droplets, AlertTriangle, Activity, Calendar, FileText, Pill, Receipt } from "lucide-react";
import { type Patient, appointments, invoices, labTests } from "@/lib/mock-data";
import { dateFmt, inr } from "@/lib/format";

interface Props {
  patient: Patient | null;
  onClose: () => void;
}

export function PatientDrawer({ patient, onClose }: Props) {
  if (!patient) return null;
  const visits = appointments.filter((a) => a.patientId === patient.id);
  const bills = invoices.filter((i) => i.patientId === patient.id);
  const labs = labTests.filter((l) => l.patientId === patient.id);

  return (
    <Sheet open={!!patient} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto scrollbar-thin">
        <SheetHeader>
          <SheetTitle className="sr-only">Patient details</SheetTitle>
        </SheetHeader>

        <div className="relative -mx-6 -mt-6 px-6 pt-10 pb-6 gradient-primary text-white">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarFallback className="text-lg gradient-teal text-white">
                {patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{patient.name}</h2>
              <div className="text-xs opacity-80 mt-1">
                {patient.uhid} • {patient.gender} • {patient.age}y
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                  <Droplets className="h-3 w-3 mr-1" /> {patient.bloodGroup}
                </Badge>
                {patient.allergies.map((a) => (
                  <Badge key={a} className="bg-destructive/30 text-white border-destructive/40 backdrop-blur">
                    <AlertTriangle className="h-3 w-3 mr-1" /> {a}
                  </Badge>
                ))}
                {patient.chronic.map((c) => (
                  <Badge key={c} className="bg-warning/30 text-white border-warning/40 backdrop-blur">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            <Info icon={Phone} label="Mobile" value={patient.mobile} />
            <Info icon={Mail} label="Email" value={patient.email ?? "—"} />
            <Info icon={MapPin} label="Address" value={patient.address} />
            <Info icon={Calendar} label="Registered" value={dateFmt(patient.registeredOn)} />
            {patient.abha && <Info icon={FileText} label="ABHA" value={patient.abha} />}

            <div className="rounded-2xl border border-border p-4 mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Activity Summary</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <Stat n={visits.length} label="Visits" />
                <Stat n={labs.length} label="Lab Tests" />
                <Stat n={bills.length} label="Invoices" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visits" className="space-y-2 mt-4">
            {visits.length === 0 && <Empty icon={Calendar} text="No visits yet" />}
            {visits.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border border-border p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-sm">{v.department}</div>
                  <div className="text-xs text-muted-foreground">
                    {dateFmt(v.date)} • {v.time} • Token #{v.token}
                  </div>
                </div>
                <Badge variant="outline">{v.status}</Badge>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="labs" className="space-y-2 mt-4">
            {labs.length === 0 && <Empty icon={Pill} text="No lab tests" />}
            {labs.map((l) => (
              <div key={l.id} className="rounded-xl border border-border p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{l.test}</div>
                  <div className="text-xs text-muted-foreground">{l.category} • {dateFmt(l.bookedOn)}</div>
                </div>
                <Badge variant="outline">{l.status}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="billing" className="space-y-2 mt-4">
            {bills.length === 0 && <Empty icon={Receipt} text="No invoices" />}
            {bills.map((b) => (
              <div key={b.id} className="rounded-xl border border-border p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{b.id} — {b.type}</div>
                  <div className="text-xs text-muted-foreground">{dateFmt(b.date)} • {b.mode}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{inr(b.amount)}</div>
                  <Badge
                    variant="outline"
                    className={
                      b.status === "Paid"
                        ? "border-success text-success"
                        : b.status === "Pending"
                          ? "border-destructive text-destructive"
                          : "border-warning text-warning"
                    }
                  >
                    {b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Phone; text: string }) {
  return (
    <div className="text-center py-8 text-sm text-muted-foreground">
      <Icon className="h-8 w-8 mx-auto mb-2 opacity-40" />
      {text}
    </div>
  );
}

export const _unused = { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Activity };
