import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users,
  CalendarDays,
  Wallet,
  BedDouble,
  TestTube,
  Pill,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  monthlyOPD,
  revenueData,
  collectionData,
  departmentPerf,
  sparkData,
  appointments,
  beds,
  findPatient,
  findDoctor,
} from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { inr, num } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboardbbbb")({
  component: Dashboard,
});

const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    fontSize: "12px",
  },
};

function Dashboard() {
  const todayAppts = appointments.slice(0, 6);
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;

  return (
    <>
      <PageHeader title="Dashboard" description="Real-time overview of your hospital operations.">
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
        </Badge>
        <Button variant="outline" size="sm">Export Report</Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <MetricCard label="OPD Patients" value={num(1284)} delta={12} icon={Users} gradient="teal" spark={sparkData} index={0} />
        <MetricCard label="IPD Patients" value={num(312)} delta={6} icon={BedDouble} gradient="blue" spark={sparkData} index={1} />
        <MetricCard label="Today Appointments" value={num(48)} delta={-3} icon={CalendarDays} gradient="primary" spark={sparkData} index={2} />
        <MetricCard label="Revenue Today" value={inr(284600)} delta={18} icon={Wallet} gradient="success" spark={sparkData} index={3} />
        <MetricCard label="Pending Bills" value={inr(112400)} delta={-8} icon={AlertCircle} gradient="warning" spark={sparkData} index={4} />
        <MetricCard label="Available Beds" value={`${availableBeds}/${beds.length}`} delta={4} icon={BedDouble} gradient="teal" spark={sparkData} index={5} />
        <MetricCard label="Pharmacy Sales" value={inr(76200)} delta={9} icon={Pill} gradient="blue" spark={sparkData} index={6} />
        <MetricCard label="Lab Tests Today" value={num(94)} delta={15} icon={TestTube} gradient="success" spark={sparkData} index={7} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-soft p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Revenue vs Expense</h3>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </div>
            <Badge variant="outline" className="text-success border-success/30 bg-success/10 gap-1">
              <TrendingUp className="h-3 w-3" /> +18.2%
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev)" />
              <Area type="monotone" dataKey="expense" stroke="var(--chart-5)" strokeWidth={2.5} fill="url(#exp)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl bg-card border border-border shadow-soft p-5"
        >
          <h3 className="font-semibold mb-1">Collection Mix</h3>
          <p className="text-xs text-muted-foreground mb-4">Cash vs Online</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={collectionData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {collectionData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {collectionData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  {d.name}
                </div>
                <span className="font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card border border-border shadow-soft p-5"
        >
          <h3 className="font-semibold">OPD vs IPD</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly volume</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyOPD}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="opd" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ipd" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl bg-card border border-border shadow-soft p-5"
        >
          <h3 className="font-semibold">Department Performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Patients this month</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={departmentPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="patients" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card border border-border shadow-soft p-5"
        >
          <h3 className="font-semibold">Bed Occupancy</h3>
          <p className="text-xs text-muted-foreground mb-4">{occupiedBeds} of {beds.length} occupied</p>
          <div className="flex items-center justify-center mb-3">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
                <circle cx="50" cy="50" r="42" stroke="var(--muted)" strokeWidth="10" fill="none" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke="var(--chart-1)" strokeWidth="10" fill="none"
                  strokeDasharray={`${(occupiedBeds / beds.length) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-semibold">{Math.round((occupiedBeds / beds.length) * 100)}%</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Occupied</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(["ICU", "General", "Private", "Pediatric"] as const).map((w) => {
              const count = beds.filter((b) => b.ward === w && b.status === "Occupied").length;
              const total = beds.filter((b) => b.ward === w).length;
              return (
                <div key={w} className="rounded-lg bg-muted/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{w}</div>
                  <div className="font-medium">{count}/{total}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-2xl bg-card border border-border shadow-soft p-5 mt-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Today's Appointments</h3>
            <p className="text-xs text-muted-foreground">Live queue</p>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="text-left py-2">Token</th>
                <th className="text-left py-2">Patient</th>
                <th className="text-left py-2">Doctor</th>
                <th className="text-left py-2">Department</th>
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayAppts.map((a) => {
                const p = findPatient(a.patientId);
                const d = findDoctor(a.doctorId);
                return (
                  <tr key={a.id} className="border-t border-border">
                    <td className="py-2.5 font-mono text-xs">#{a.token}</td>
                    <td className="py-2.5 font-medium">{p?.name}</td>
                    <td className="py-2.5">{d?.name}</td>
                    <td className="py-2.5 text-muted-foreground">{a.department}</td>
                    <td className="py-2.5">{a.time}</td>
                    <td className="py-2.5">
                      <Badge
                        variant="outline"
                        className={
                          a.status === "Completed" ? "border-success text-success" :
                          a.status === "In Consultation" ? "border-info text-info" :
                          a.status === "Cancelled" ? "border-destructive text-destructive" :
                          "border-warning text-warning"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}

export const _u = { Legend };
