import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ElementType, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Mail,
  Check,
  Clock3,
  HeartPulse,
  Lock,
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
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, ALL_MODULES, type ModuleKey } from "@/store/authStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import RegistrationBackground from "@/image/Login bg image.png"
import Nicon from "@/image/N-icon.png"

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const MODULE_META: Record<
  Exclude<ModuleKey, "Overview" | "Settings">,
  { icon: ElementType; description: string; color: string }
> = {
  OPD: {
    icon: Stethoscope,
    description: "Out-patient registration, queue, prescriptions",
    color: "from-blue-500/15 to-blue-500/5",
  },
  IPD: {
    icon: BedDouble,
    description: "Admissions, beds, nursing & discharge",
    color: "from-sky-100 to-blue-50",
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
    color: "from-blue-100 to-indigo-50",
  },
};

const SELECTABLE = ALL_MODULES.filter(
  (module) => module !== "Overview" && module !== "Settings",
) as (keyof typeof MODULE_META)[];

function RegisterPage() {
  const navigate = useNavigate();
  const registerHospital = useAuthStore((state) => state.registerHospital);

  const [hospitalName, setHospitalName] = useState("");
  const [hospitalEmail, setHospitalEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [modules, setModules] = useState<ModuleKey[]>(["OPD"]);
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const toggle = (module: ModuleKey) => {
    setModules((previous) =>
      previous.includes(module)
        ? previous.filter((item) => item !== module)
        : [...previous, module],
    );
  };

  const selectAll = () => setModules([...SELECTABLE]);
  const clearAll = () => setModules([]);

  const submitRegistration = async () => {
    if (!hospitalName || !hospitalEmail || !password) {
      toast.error("Please fill all required fields");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (modules.length === 0) {
      toast.error("Select at least one module");
      return false;
    }

    if (registrationComplete) return true;

    const data = {
      hospitalName,
      hospitalEmail,
      email,
      password,
      phone,
      address,
      modules,
    };

    console.log("REGISTER DATA:", { ...data, password: "[REDACTED]" });

    setSubmitting(true);

    try {
      await registerHospital(data);
      setRegistrationComplete(true);
      toast.success("Registration data sent successfully.");
      return true;
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      toast.error(error instanceof Error ? error.message : "Registration failed");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (registrationComplete) {
      navigate({ to: "/login" });
      return;
    }

    if (await submitRegistration()) {
      navigate({ to: "/login" });
    }
  };

  const onNext = async () => {
    const form = document.querySelector<HTMLFormElement>("#registration-form");

    if (!form?.reportValidity()) return;
    if (!(await submitRegistration())) return;

    document
      .getElementById("module-picker")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="relative isolate min-h-screen bg-[#f1f8fd] text-slate-900">
      <img
        src={RegistrationBackground}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full object-cover xl:block"
      />

      <header className="relative z-10 flex h-17 items-center justify-between border-b border-sky-100 bg-white px-5 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-3" aria-label="Ncuresoft home">
          <img src={Nicon} alt="" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold tracking-tight text-[#123260]">
            Ncuresoft
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
            <img src={Nicon} alt="" className="h-5 w-5 object-contain" />
            <span>Smarter Healthcare&nbsp; | &nbsp;Better Tomorrow</span>
          </div>

          <Link
            to="/login"
            className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      <form
        id="registration-form"
        onSubmit={onSubmit}
        className="relative isolate mx-auto grid w-full max-w-[1600px] min-w-0 grid-cols-1 gap-4 px-3 py-4 sm:px-5 md:gap-5 md:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] xl:grid-cols-[minmax(210px,0.72fr)_minmax(300px,1fr)_minmax(360px,1.2fr)] xl:gap-4 xl:px-10 xl:py-6"
      >
        {/* Desktop: left side over the background image. Mobile: placed last. */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 order-3 flex min-h-0 flex-col justify-between overflow-hidden rounded-xl bg-transparent lg:order-1 lg:min-h-97.5 xl:min-h-[calc(100vh-116px)]"
        >
          <div className="max-w-sm p-4 pt-5 sm:p-6 sm:pt-8 lg:p-8 xl:pt-14">
            <h1 className="text-3xl font-bold leading-[1.12] tracking-tight text-blue-700 sm:text-4xl">
            Your Hospital.
           <span className="mt-1 block text-blue-500">Our Priority.</span>
           </h1>
           
            <p className="mt-4 max-w-xs text-sm leading-6 text-black">
           <b> All-in-one Hospital Management System for a smarter, more efficient and
            patient-centric healthcare experience.</b>
           </p>

            <ul className="mt-7 grid gap-3 text-sm font-medium text-[#102f5d]">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm">
                  <SettingsIcon className="h-4 w-4" />
                </span>
                Streamline Operations
              </li>

              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm">
                  <HeartPulse className="h-4 w-4" />
                </span>
                Improve Patient Care
              </li>

              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm">
                  <Clock3 className="h-4 w-4" />
                </span>
                Save Time &amp; Resources
              </li>

              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </span>
                Grow Your Organization
              </li>
            </ul>
          </div>

          
        </motion.aside>

        {/* Registration details: first on mobile, middle column on desktop. */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04 }}
          className="relative z-10 order-1 rounded-xl border border-sky-100 bg-white p-5 shadow-[0_8px_28px_rgba(35,92,140,0.10)] sm:p-6 lg:order-2"
        >
          <div className="mb-5 flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-blue-600">
              <Building2 className="h-8 w-8" strokeWidth={2.1} />
            </span>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#123260]">
                Register Your Hospital
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Set up your account and choose only the modules you need. You can change
                this anytime.
              </p>
            </div>
          </div>

          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#18365f]">
              <Building2 className="h-4 w-4 text-blue-600" />
              Hospital Details
            </div>

            <div className="space-y-3.5">
              <div>
                <Label htmlFor="hospital-name" className="text-xs font-semibold text-slate-700">
                  Hospital Name <span className="text-blue-600">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="hospital-name"
                    required
                    value={hospitalName}
                    onChange={(event) => setHospitalName(event.target.value)}
                    placeholder="e.g. Ncuresoft General Hospital"
                    className="h-9 border-slate-200 pl-9 text-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospital-email" className="text-xs font-semibold text-slate-700">
                  Hospital Email <span className="text-blue-600">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <Input
                    id="hospital-email"
                    type="email"
                    required
                    value={hospitalEmail}
                    onChange={(event) => setHospitalEmail(event.target.value)}
                    placeholder="hospital@example.com"
                    className="h-9 border-slate-200 pl-9 text-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospital-phone" className="text-xs font-semibold text-slate-700">
                  Phone
                </Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="hospital-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-9 border-slate-200 pl-9 text-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospital-address" className="text-xs font-semibold text-slate-700">
                  Address
                </Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Textarea
                    id="hospital-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Street, City, State"
                    className="min-h-14 resize-y border-slate-200 pl-9 text-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospital-password" className="text-xs font-semibold text-slate-700">
                  Password <span className="text-blue-600">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <Input
                    id="hospital-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    className="h-10 border-slate-200 pl-9 text-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              disabled={submitting}
              onClick={onNext}
              className="mt-5 h-11 w-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {submitting ? "Sending…" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.section>

        {/* Modules: after registration form on mobile; right side on desktop. */}
        <motion.section
          id="module-picker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="relative z-10 order-2 rounded-xl border border-sky-100 bg-white p-5 shadow-[0_8px_28px_rgba(35,92,140,0.10)] sm:p-6 lg:order-3 lg:col-span-2 xl:col-span-1"
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-blue-600">
                <SettingsIcon className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-[#123260]">Choose Modules</h2>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                onClick={selectAll}
                className="h-8 rounded-full bg-blue-600 px-4 text-xs text-white hover:bg-blue-700"
              >
                Select all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clearAll}
                className="h-8 rounded-full border-slate-200 px-4 text-xs text-slate-700"
              >
                Clear
              </Button>
            </div>
          </div>

          <p className="mb-4 text-xs leading-5 text-slate-500">
            Pick any combination. Only the modules you select will appear in your
            workspace. Overview &amp; Settings are included by default.
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {SELECTABLE.map((module) => {
              const meta = MODULE_META[module];
              const Icon = meta.icon;
              const active = modules.includes(module);

              return (
                <button
                  type="button"
                  key={module}
                  onClick={() => toggle(module)}
                  aria-pressed={active}
                  className={cn(
                    "relative flex min-h-20.5 items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    `bg-linear-to-br ${meta.color}`,
                    active
                      ? "border-blue-200"
                      : "border-transparent hover:border-slate-200",
                    module === "HR" && "sm:col-span-2",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/80 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="min-w-0 flex-1 pr-4">
                    <span className="block text-sm font-semibold text-[#18365f]">
                      {module}
                    </span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-600">
                      {meta.description}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "absolute right-3 top-3 flex h-4.5 w-4.5 items-center justify-center rounded-full border",
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white/80 text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">
              {modules.length} module{modules.length === 1 ? "" : "s"} selected
            </span>

            <Button
              type="submit"
              disabled={submitting}
              className="h-10 bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {submitting
                ? "Creating…"
                : registrationComplete
                  ? "Continue to Sign in"
                  : "Create Hospital"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.section>
      </form>
    </div>
  );
}