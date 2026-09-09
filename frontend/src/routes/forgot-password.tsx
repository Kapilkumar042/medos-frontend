import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: Page,
});

function Page() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-card border border-border shadow-elegant p-8"
      >
        <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we'll send a reset link.
        </p>
        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Reset link sent");
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" required type="email" placeholder="you@hospital.com" className="pl-9" />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-teal text-white border-0 hover:opacity-90 h-11">Send reset link</Button>
          </form>
        ) : (
          <div className="mt-6 rounded-xl bg-success/10 text-success p-4 text-sm">
            Check your inbox — a reset link is on its way.
          </div>
        )}
      </motion.div>
    </div>
  );
}
