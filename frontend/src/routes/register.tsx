import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Stethoscope,
  BedDouble,
  FlaskConical,
  Scan,
  Pill,
  Receipt,
  Users,
  Settings as SettingsIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, ALL_MODULES, type ModuleKey } from "@/store/authStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
const MODULE_META: Record<
  Exclude<ModuleKey, "Overview" | "Settings">,
  { icon: React.ElementType; description: string; color: string }
> = {
  OPD: {
    icon: Stethoscope,
    description: "Out-patient registration, queue, prescriptions",
    color: "from-blue-500/15 to-blue-500/5",
  },
  IPD: {
    icon: BedDouble,
    description: "Admissions, beds, nursing & discharge",
    color: "from-violet-500/15 to-violet-500/5",
  },
  Laboratory: {
    icon: FlaskConical,
    description: "Lab tests, samples & reports",
    color: "from-emerald-500/15 to-emerald-500/5",
  },
  Radiology: {
    icon: Scan,
    description: "X-Ray, CT, MRI & reports",
    color: "from-amber-500/15 to-amber-500/5",
  },
  Pharmacy: {
    icon: Pill,
    description: "Inventory, stock & sales",
    color: "from-rose-500/15 to-rose-500/5",
  },
  Billing: {
    icon: Receipt,
    description: "OPD/IPD billing, doctor share, expenses",
    color: "from-teal-500/15 to-teal-500/5",
  },
  HR: {
    icon: Users,
    description: "Staff, attendance & payroll",
    color: "from-indigo-500/15 to-indigo-500/5",
  },
};
const SELECTABLE = ALL_MODULES.filter(
  (m) => m !== "Overview" && m !== "Settings",
) as (keyof typeof MODULE_META)[];
function RegisterPage() {
  const navigate = useNavigate();
  const registerHospital = useAuthStore((s) => s.registerHospital);
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalEmail, setHospitalEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [modules, setModules] = useState<ModuleKey[]>(["OPD"]);
  const [submitting, setSubmitting] = useState(false);
  const toggle = (m: ModuleKey) =>
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  const selectAll = () => setModules([...SELECTABLE]);
  const clearAll = () => setModules([]);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName || !hospitalEmail || !password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (modules.length === 0) {
      toast.error("Select at least one module");
      return;
    }
    setSubmitting(true);
    try {
      await registerHospital({
        hospitalName,
        hospitalEmail,
        email,
        password,
        phone,
        address,
        modules,
      });
      toast.success("Hospital registered! Please sign in.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">MedOS</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Hospital ERP
              </div>
            </div>
          </div>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Already registered? <span className="text-primary underline">Sign in</span>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight">Register your hospital</h1>
          <p className="text-muted-foreground mt-1.5">
            Set up your account and choose only the modules you need. You can change this anytime.
          </p>
          <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Hospital + Admin */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Hospital Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Hospital Name *</Label>
                    <Input
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="MedOS General Hospital"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Hospital Email *</Label>
                    <Input
                      value={hospitalEmail}
                      onChange={(e) => setHospitalEmail(e.target.value)}
                      placeholder="hospital@medos.health"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, City, State"
                        className="pl-9 min-h-[72px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Modules */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Choose Modules</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={selectAll}>
                      Select all
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
                      Clear
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Pick any combination — only the modules you select will appear in your workspace.
                  Overview & Settings are included by default.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SELECTABLE.map((m) => {
                    const meta = MODULE_META[m];
                    const Icon = meta.icon;
                    const active = modules.includes(m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => toggle(m)}
                        className={cn(
                          "relative text-left rounded-xl border p-4 transition-all bg-gradient-to-br",
                          meta.color,
                          active
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-background/80 border border-border flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{m}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {meta.description}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition",
                              active
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border bg-background",
                            )}
                          >
                            {active && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {modules.length} module{modules.length === 1 ? "" : "s"} selected
                  </div>
                  <Button type="submit" disabled={submitting} className="h-11 px-6">
                    {submitting ? (
                      "Creating…"
                    ) : (
                      <>
                        Create Hospital <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
