import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  CalendarDays,
  MoreVertical,
  Check,
  X,
  CalendarClock,
  PhoneCall,
  Trash2,
} from "lucide-react";
import { dateFmt } from "@/lib/format";
import { useDoctorStore } from "@/store/doctorStore";
import {
  useAppointmentStore,
  type AppointmentRecord,
  type AppointmentStatus,
  type ServiceType,
} from "@/store/appointmentStore";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  acceptAppointment,
} from "@/api/appointmentApi";
import { useEffect } from "react";
import { toast } from "sonner";
import { useDoctors } from "@/hooks/useDoctors";
import { useAuthStore } from "@/store/authStore";
export const Route = createFileRoute("/_authenticated/opd/appointments")({
  component: Page,
});

const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];
const SERVICES: ServiceType[] = ["Consultant", "Lab Test", "Radiology", "Other"];

function statusClass(s: AppointmentStatus) {
  switch (s) {
    case "Accepted":
    case "Completed":
      return "border-success text-success";
    case "Cancelled":
      return "border-destructive text-destructive";
    case "Re-scheduled":
      return "border-info text-info";
    case "Call Requested":
      return "border-warning text-warning";
    default:
      return "border-muted-foreground text-muted-foreground";
  }
}
type AppointmentForm = {
  patientName: string;
  phone: string;
  bloodGroup: string;
  gender: "Male" | "Female" | "Other";
  age: string;
  service: ServiceType;
  otherService: string;
  doctor: string;
  department: string;
  date: string;
  time: string;
  type: "New" | "Follow-up";
  notes: string;
};
function Page() {
  const hospitalName = useAuthStore((state) => state.hospital?.name ?? "Hospital");
  const [items, setItems] = useState<AppointmentRecord[]>([]);
  const { doctors, loading: doctorsLoading } = useDoctors();
  const [open, setOpen] = useState(false);
  const [reschedFor, setReschedFor] = useState<AppointmentRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
      2,
      "0",
    )}`;
  };
  const [form, setForm] = useState<AppointmentForm>({
    patientName: "",
    phone: "",
    bloodGroup: "Unknown",
    gender: "Male" as "Male" | "Female" | "Other",
    age: "",
    service: "Consultant" as ServiceType,
    otherService: "",
    doctor: "",
    department: "",
    date: new Date().toISOString().slice(0, 10),
    time: getCurrentTime(),
    type: "New" as "New" | "Follow-up",
    notes: "",
  });

  const resetForm = () =>
    setForm({
      patientName: "",
      phone: "",
      bloodGroup: "Unknown",
      gender: "Male",
      age: "",
      service: "Consultant",
      otherService: "",
      doctor: "",
      department: "",
      date: new Date().toISOString().slice(0, 10),
      time: getCurrentTime(),
      type: "New",
      notes: "",
    });

  const openWhatsApp = (
    phone: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
  ) => {
    const digits = phone.replace(/\D/g, "");
    const whatsappPhone = digits.length === 10 ? `91${digits}` : digits;

    const message = `Dear ${patientName},

Your appointment has been booked successfully at ${hospitalName}.

Date: ${appointmentDate}

Thank you,
${hospitalName}`;

    window.open(
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openEditableWhatsApp = (
    appointment: AppointmentRecord,
    defaultMessage: string,
    popup: Window | null,
  ) => {
    if (!popup) {
      toast.error("Please allow popups to open WhatsApp");
      return;
    }

    const message = window.prompt("Review or edit the WhatsApp message", defaultMessage);
    if (message === null) {
      popup.close();
      return;
    }

    const digits = appointment.phone.replace(/\D/g, "");
    const whatsappPhone = digits.length === 10 ? `91${digits}` : digits;
    popup.location.href = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  };

  const appointmentMessage = (
    appointment: AppointmentRecord,
    intro: string,
    date = appointment.appointment_date,
    time = appointment.appointment_time,
  ) => `Dear ${appointment.patient_name},\n\n${intro}\n\nDate: ${date}\nTime: ${time}\n\nThank you,\n${hospitalName}`;

  const acceptAndNotify = async (appointment: AppointmentRecord) => {
    const whatsappWindow = window.open("about:blank", "_blank");
    try {
      await acceptAppointment(appointment.id);
      await loadAppointments();
      toast.success(`Accepted #${appointment.token}`, { duration: 500 });
      openEditableWhatsApp(
        appointment,
        appointmentMessage(appointment, "Your appointment has been accepted."),
        whatsappWindow,
      );
    } catch (error) {
      whatsappWindow?.close();
      console.error(error);
      toast.error("Failed to accept appointment");
    }
  };

  const requestCallAndNotify = async (appointment: AppointmentRecord) => {
    const whatsappWindow = window.open("about:blank", "_blank");
    const message = window.prompt(
      "Review or edit the WhatsApp message",
      appointmentMessage(
        appointment,
        "We received your request. Our team will call you shortly.",
      ),
    );

    try {
      await updateAppointmentStatus(appointment.id, "Call Requested");
      await loadAppointments();
      toast.success("Call requested", { duration: 500 });

      if (message === null) {
        whatsappWindow?.close();
        return;
      }
      if (!whatsappWindow) {
        toast.error("Please allow popups to open WhatsApp");
        return;
      }

      const digits = appointment.phone.replace(/\D/g, "");
      const whatsappPhone = digits.length === 10 ? `91${digits}` : digits;
      whatsappWindow.location.href = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
    } catch (error) {
      whatsappWindow?.close();
      console.error(error);
      toast.error("Failed to request a call");
    }
  };

  const rescheduleAppointment = async (date: string, time: string) => {
    if (!reschedFor) return;
    if (!date || !time) {
      toast.error("Select both a date and time");
      return;
    }

    const whatsappWindow = window.open("about:blank", "_blank");
    try {
      await updateAppointment(reschedFor.id, {
        appointment_date: date,
        appointment_time: time,
        status: "Re-scheduled",
      });
      await loadAppointments();
      toast.success(`Rescheduled #${reschedFor.token}`, { duration: 500 });
      openEditableWhatsApp(
        reschedFor,
        appointmentMessage(reschedFor, "Your appointment has been rescheduled.", date, time),
        whatsappWindow,
      );
      setReschedFor(null);
    } catch (error) {
      whatsappWindow?.close();
      console.error(error);
      toast.error("Failed to reschedule appointment");
    }
  };
  const submit = async () => {
    if (!form.patientName || !form.phone) {
      toast.error("Patient name and phone are required");
      return;
    }
    if (form.service === "Other" && !form.otherService.trim()) {
      toast.error("Please specify the service");
      return;
    }
    try {
      await createAppointment({
        patient_name: form.patientName,
        phone: form.phone,
        blood_group: form.bloodGroup,
        gender: form.gender,
        age: form.age ? Number(form.age) : null,
        doctor_id: form.doctor ? Number(form.doctor) : null,
        department: form.department,
        service: form.service,
        other_service: form.otherService,
        appointment_date: form.date,
        appointment_time: form.time,
        visit_type: form.type,
        notes: form.notes,
      });

      await loadAppointments();

      toast.success("Appointment booked", {
  duration: 500,
});
      openWhatsApp(form.phone, form.patientName, form.date, form.time);
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to create appointment");
    }
  };
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await getAppointments();
      setItems(data);
    } catch {
      toast.error("Failed to load appointments");
    }
  };
  const cols: Column<AppointmentRecord>[] = [
    {
      key: "token",
      header: "Token",
      accessor: (r) => r.token,
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">#{r.token}</span>,
    },
    {
      key: "patient",
      header: "Patient",
      accessor: (r) => r.patient_name,
      cell: (r) => (
        <div>
          <div className="font-medium">{r.patient_name}</div>
          <div className="text-xs text-muted-foreground">
            {r.phone} • {r.blood_group}
          </div>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      accessor: (r) => (r.service === "Other" ? (r.other_service ?? "Other") : r.service),
      cell: (r) => (
        <Badge variant="outline">{r.service === "Other" ? r.other_service : r.service}</Badge>
      ),
    },
    {
      key: "doctor",
      header: "Doctor",
      accessor: (r) => (r.doctor ? `Dr. ${r.doctor.first_name} ${r.doctor.last_name}` : "N/A"),
    },
    {
      key: "date",
      header: "Date",
      accessor: (r) => r.appointment_date,
      sortable: true,
      cell: (r) => dateFmt(r.appointment_date),
    },
    { key: "time", header: "Time", accessor: (r) => r.appointment_time },
    {
      key: "type",
      header: "Type",
      accessor: (r) => r.visit_type,
      cell: (r) => <Badge variant="outline">{r.visit_type}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => r.status,
      cell: (r) => (
        <Badge variant="outline" className={statusClass(r.status)}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "w-16 text-right",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              disabled={r.status === "Accepted"}
              onClick={() => void acceptAndNotify(r)}
            >
              <Check className="h-4 w-4 mr-2 text-success" /> Accept
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await updateAppointmentStatus(r.id, "Cancelled");

                await loadAppointments();

                toast.success("Appointment cancelled", {
  duration: 500,
});
              }}
            >
              <X className="h-4 w-4 mr-2 text-destructive" /> Cancel
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setRescheduleDate(r.appointment_date);
                setRescheduleTime(r.appointment_time);
                setReschedFor(r);
              }}
            >
              <CalendarClock className="h-4 w-4 mr-2 text-info" /> Re-schedule
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void requestCallAndNotify(r)}
            >
              <PhoneCall className="h-4 w-4 mr-2 text-warning" /> Request for Call
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                await deleteAppointment(r.id);
                await loadAppointments();
                toast.success("Appointment deleted", {
  duration: 500,
});
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Schedule, manage, and track patient appointments."
      >
        <Button variant="outline" size="sm" asChild>
          <Link to="/opd/queue">
            <CalendarDays className="h-4 w-4 mr-1.5" /> View Queue
          </Link>
        </Button>
        <Button
          size="sm"
          className="text-white border-0 hover:opacity-90"
          style={{ backgroundColor: "#2D5CF2" }}
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Book Appointment
        </Button>
      </PageHeader>

      <DataTable
        data={items}
        columns={cols}
        searchKeys={["patient_name", "phone", "appointment_date", "status"]}
        exportFileName="appointments"
        emptyMessage="No appointments yet. Click Book Appointment to create one."
      />

      {/* Book dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Patient Name *</Label>
              <Input
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v: any) => setForm({ ...form, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Blood Group</Label>
              <Select
                value={form.bloodGroup}
                onValueChange={(v) => setForm({ ...form, bloodGroup: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service *</Label>
              <Select
                value={form.service}
                onValueChange={(v: ServiceType) => setForm({ ...form, service: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.service === "Other" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label>Specify Service *</Label>
                <Input
                  value={form.otherService}
                  onChange={(e) => setForm({ ...form, otherService: e.target.value })}
                  placeholder="e.g. Physiotherapy, Vaccination…"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Doctor</Label>
              <Select
                value={form.doctor}
                onValueChange={(v) => {
                  const d = doctors.find((x) => String(x.id) === v);
                  setForm({ ...form, doctor: v, department: d?.department ?? form.department });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.first_name} {d.last_name} — {d.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Cardiology"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time *</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Old">Old</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Symptoms / reason for visit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              className="text-white border-0 hover:opacity-90"
              style={{ backgroundColor: "#2D5CF2" }}
            >
              Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={!!reschedFor} onOpenChange={(o) => !o && setReschedFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Re-schedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(event) => setRescheduleDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-time">New Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleTime}
                onChange={(event) => setRescheduleTime(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReschedFor(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void rescheduleAppointment(rescheduleDate, rescheduleTime)}>
              Update Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

