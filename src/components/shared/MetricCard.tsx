import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  delta?: number; // percent
  icon: LucideIcon;
  gradient?: "teal" | "blue" | "primary" | "success" | "warning" | "danger";
  spark?: { v: number }[];
  index?: number;
}

const gradientMap = {
  teal: "gradient-teal",
  blue: "gradient-blue",
  primary: "gradient-primary",
  success: "gradient-success",
  warning: "gradient-warning",
  danger: "gradient-danger",
} as const;

export function MetricCard({ label, value, delta, icon: Icon, gradient = "teal", spark, index = 0 }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-soft hover:shadow-elegant transition-shadow p-5"
    >
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl", gradientMap[gradient])} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-2xl md:text-3xl font-semibold mt-2 tracking-tight">{value}</div>
        </div>
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0", gradientMap[gradient])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative flex items-end justify-between mt-4">
        {delta !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10",
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </div>
        )}
        {spark && (
          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="var(--chart-1)" strokeWidth={2} fill={`url(#spark-${label})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
