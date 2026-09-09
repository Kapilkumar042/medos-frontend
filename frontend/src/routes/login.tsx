import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Activity,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});
type FormData = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 gradient-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full gradient-teal blur-3xl" />
          <div className="absolute bottom-20 right-20 h-80 w-80 rounded-full gradient-blue blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl gradient-teal flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">MedOS</div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">Hospital ERP</div>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            The modern operating system for healthcare.
          </h1>
          <p className="text-white/70 max-w-md">
            One platform for OPD, IPD, Lab, Pharmacy, Billing, and Analytics. Built for speed,
            designed for clinicians.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            {[
              { icon: ShieldCheck, label: "HIPAA-grade" },
              { icon: Activity, label: "Real-time" },
              { icon: HeartPulse, label: "Clinician-first" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl glass p-3 text-center">
                <f.icon className="h-5 w-5 mx-auto mb-1.5 text-white" />
                <div className="text-xs">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/50">© 2026 MedOS Health Systems</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl bg-card border border-border p-8 shadow-elegant">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to continue to MedOS</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    {...register("email")}
                    className="pl-9"
                    placeholder="you@hospital.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-secondary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    {...register("password")}
                    className="pl-9 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Checkbox id="remember" defaultChecked />
                <label htmlFor="remember" className="text-muted-foreground">
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gradient-teal text-white border-0 hover:opacity-90 h-11"
              >
                {submitting ? (
                  "Signing in…"
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </form>

            <Link
              to="/register"
              className="text-sm text-muted-foreground hover:text-foreground mt-4 block text-center"
            >
              Not registered yet? <span className="text-primary underline">Create an account</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
