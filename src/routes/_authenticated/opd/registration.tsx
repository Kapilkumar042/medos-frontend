import { createFileRoute } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Plus, Trash2, Save, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { doctors } from "@/lib/mock-data";
import { inr } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/opd/registration")({
  component: Page,
});

const billItem = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().min(1),
  price: z.coerce.number().min(0),
});
const schema = z.object({
  uhid: z.string().min(2, "Required"),
  abha: z.string().optional(),
  aadhaar: z.string().optional(),
  name: z.string().min(2, "Required"),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.string().min(1, "Required"),
  mobile: z.string().min(10, "Min 10 digits"),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().min(2),
  bloodGroup: z.string(),
  marital: z.string().optional(),
  occupation: z.string().optional(),
  emergency: z.string().optional(),
  doctorId: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  reference: z.string().optional(),
  visitDate: z.string().min(1, "Required"),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(billItem).min(1),
  discount: z.coerce.number().min(0),
  gstPct: z.coerce.number().min(0),
  paymentMode: z.enum(["Cash", "Card", "UPI", "Insurance"]),
});
type FormData = z.infer<typeof schema>;

function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      uhid: `UH${String(Math.floor(Math.random() * 90000) + 10000)}`,
      gender: "Male",
      bloodGroup: "O+",
      visitDate: today,
      items: [{ description: "Doctor Consultation", qty: 1, price: 500 }],
      discount: 0,
      gstPct: 0,
      paymentMode: "Cash",
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const discount = Number(watch("discount") || 0);
  const gstPct = Number(watch("gstPct") || 0);

  const totals = useMemo(() => {
    const sub = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
    const afterDisc = Math.max(0, sub - discount);
    const gst = (afterDisc * gstPct) / 100;
    return { sub, gst, net: afterDisc + gst };
  }, [items, discount, gstPct]);

  const onSubmit = (d: FormData) => {
    toast.success(`Patient ${d.name} registered • Net ${inr(totals.net)}`);
  };

  return (
    <>
      <PageHeader title="OPD Registration" description="Register new walk-in patients with billing.">
        <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" /> Print
        </Button>
        <Button size="sm" form="reg-form" type="submit" className="gradient-teal text-white border-0 hover:opacity-90">
          <Save className="h-4 w-4 mr-1.5" /> Save & Generate Bill
        </Button>
      </PageHeader>

      <form id="reg-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-soft p-5 space-y-5">
          <Section title="Patient Information">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="UHID" error={errors.uhid?.message}><Input {...register("uhid")} /></Field>
              <Field label="ABHA Number"><Input {...register("abha")} placeholder="14-digit ABHA" /></Field>
              <Field label="Aadhaar Number"><Input {...register("aadhaar")} placeholder="XXXX-XXXX-XXXX" /></Field>
              <Field label="Patient Name" error={errors.name?.message}><Input {...register("name")} /></Field>
              <Field label="Gender">
                <Select defaultValue="Male" onValueChange={(v) => setValue("gender", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of Birth" error={errors.dob?.message}><Input type="date" {...register("dob")} /></Field>
              <Field label="Mobile" error={errors.mobile?.message}><Input {...register("mobile")} /></Field>
              <Field label="Email"><Input type="email" {...register("email")} /></Field>
              <Field label="Blood Group">
                <Select defaultValue="O+" onValueChange={(v) => setValue("bloodGroup", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Address" className="md:col-span-3" error={errors.address?.message}>
                <Textarea rows={2} {...register("address")} />
              </Field>
              <Field label="Marital Status"><Input {...register("marital")} /></Field>
              <Field label="Occupation"><Input {...register("occupation")} /></Field>
              <Field label="Emergency Contact"><Input {...register("emergency")} /></Field>
            </div>
          </Section>

          <Section title="Visit Details">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Consultant Doctor" error={errors.doctorId?.message}>
                <Select onValueChange={(v) => {
                  setValue("doctorId", v);
                  const d = doctors.find((x) => x.id === v);
                  if (d) setValue("department", d.department);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.department}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Department" error={errors.department?.message}><Input {...register("department")} /></Field>
              <Field label="Reference Doctor"><Input {...register("reference")} /></Field>
              <Field label="Visit Date" error={errors.visitDate?.message}><Input type="date" {...register("visitDate")} /></Field>
              <Field label="Symptoms" className="md:col-span-2"><Input {...register("symptoms")} placeholder="Chief complaints" /></Field>
              <Field label="Notes" className="md:col-span-3"><Textarea rows={2} {...register("notes")} /></Field>
            </div>
          </Section>

          <Section title="Billing Items">
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-12 gap-2 items-start">
                  <Input className="col-span-6" placeholder="Description" {...register(`items.${i}.description`)} />
                  <Input className="col-span-2" type="number" placeholder="Qty" {...register(`items.${i}.qty`)} />
                  <Input className="col-span-3" type="number" placeholder="Price" {...register(`items.${i}.price`)} />
                  <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", qty: 1, price: 0 })}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Item
              </Button>
            </div>
          </Section>
        </motion.div>

        {/* Summary */}
        <motion.aside initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border shadow-soft p-5 h-fit lg:sticky lg:top-20">
          <h3 className="font-semibold mb-4">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={inr(totals.sub)} />
            <Field label="Discount (₹)"><Input type="number" {...register("discount")} /></Field>
            <Field label="GST %"><Input type="number" {...register("gstPct")} /></Field>
            <Row label="GST" value={inr(totals.gst)} />
            <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
              <span>Net Payable</span>
              <span className="text-secondary">{inr(totals.net)}</span>
            </div>
            <Field label="Payment Mode">
              <Select defaultValue="Cash" onValueChange={(v) => setValue("paymentMode", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cash", "Card", "UPI", "Insurance"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Button type="submit" className="w-full mt-4 gradient-teal text-white border-0 hover:opacity-90 h-11">
            Save & Generate Bill
          </Button>
        </motion.aside>
      </form>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children, error, className = "" }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground font-medium">{value}</span></div>;
}
