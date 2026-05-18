// Mock data for the entire HMS. All modules pull from here.

export type Gender = "Male" | "Female" | "Other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";

export interface Patient {
  id: string;
  uhid: string;
  abha?: string;
  name: string;
  gender: Gender;
  age: number;
  dob: string;
  mobile: string;
  email?: string;
  address: string;
  bloodGroup: BloodGroup;
  allergies: string[];
  chronic: string[];
  registeredOn: string;
  lastVisit?: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  fee: number;
  experience: number;
  available: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  department: string;
  date: string;
  time: string;
  status: "Scheduled" | "Checked In" | "In Consultation" | "Completed" | "Cancelled";
  token: number;
  type: "New" | "Follow-up";
}

export interface Bed {
  id: string;
  number: string;
  ward: "ICU" | "General" | "Private" | "Semi-Private" | "Pediatric" | "Maternity";
  status: "Available" | "Occupied" | "Cleaning" | "Reserved";
  patientId?: string;
  charge: number;
}

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  category: string;
  batch: string;
  expiry: string;
  stock: number;
  price: number;
  unit: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  test: string;
  category: "Hematology" | "Biochemistry" | "Microbiology" | "Pathology";
  status: "Booked" | "Sample Collected" | "Processing" | "Completed";
  bookedOn: string;
  price: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  type: "OPD" | "IPD" | "Pharmacy" | "Lab";
  date: string;
  amount: number;
  paid: number;
  status: "Paid" | "Pending" | "Partial";
  mode: "Cash" | "Card" | "UPI" | "Insurance";
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  contact: string;
  joined: string;
  salary: number;
  status: "Active" | "On Leave" | "Inactive";
}

const firstNames = ["Aarav", "Priya", "Rohan", "Isha", "Karan", "Meera", "Arjun", "Saanvi", "Vivaan", "Ananya", "Kabir", "Diya", "Reyansh", "Aanya", "Vihaan", "Pari", "Aditya", "Riya", "Krishna", "Tara"];
const lastNames = ["Sharma", "Patel", "Mehta", "Gupta", "Iyer", "Nair", "Singh", "Reddy", "Kapoor", "Verma", "Joshi", "Khan", "Malhotra", "Rao", "Das"];
const departments = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology", "ENT", "Dermatology", "General Medicine", "Radiology", "Oncology"];
const allergies = ["Penicillin", "Pollen", "Dust", "Peanuts", "Latex", "Sulfa", "Shellfish"];
const chronic = ["Diabetes Type 2", "Hypertension", "Asthma", "Arthritis", "Hypothyroidism", "Migraine"];

const seed = (i: number) => {
  let x = Math.sin(i + 1) * 10000;
  return x - Math.floor(x);
};
const pick = <T,>(arr: T[], i: number) => arr[Math.floor(seed(i) * arr.length)]!;

export const patients: Patient[] = Array.from({ length: 60 }).map((_, i) => {
  const fn = pick(firstNames, i * 3);
  const ln = pick(lastNames, i * 5);
  const gender = (i % 3 === 0 ? "Female" : i % 3 === 1 ? "Male" : "Other") as Gender;
  const age = 5 + Math.floor(seed(i * 7) * 70);
  return {
    id: `P${1000 + i}`,
    uhid: `UH${String(24000 + i).padStart(5, "0")}`,
    abha: i % 2 === 0 ? `${91}-${1000 + i}-${2000 + i}-${3000 + i}` : undefined,
    name: `${fn} ${ln}`,
    gender,
    age,
    dob: `${2025 - age}-0${1 + (i % 9)}-1${i % 9}`,
    mobile: `+91 9${String(800000000 + i * 137).slice(0, 9)}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
    address: `${10 + i}, MG Road, ${pick(["Bengaluru", "Mumbai", "Pune", "Delhi", "Chennai"], i)}`,
    bloodGroup: pick(["A+", "B+", "O+", "AB+", "A-", "O-"] as BloodGroup[], i * 2),
    allergies: i % 4 === 0 ? [pick(allergies, i)] : [],
    chronic: i % 5 === 0 ? [pick(chronic, i)] : [],
    registeredOn: `2024-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 27)).padStart(2, "0")}`,
    lastVisit: `2025-${String(1 + (i % 11)).padStart(2, "0")}-${String(1 + (i % 27)).padStart(2, "0")}`,
  };
});

export const doctors: Doctor[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `D${100 + i}`,
  name: `Dr. ${pick(firstNames, i * 11)} ${pick(lastNames, i * 13)}`,
  department: pick(departments, i),
  specialization: pick(["MBBS, MD", "MBBS, MS", "MBBS, DM", "MBBS, DNB"], i),
  fee: 400 + i * 50,
  experience: 3 + (i % 22),
  available: i % 4 !== 0,
}));

const todayISO = new Date().toISOString().slice(0, 10);
export const appointments: Appointment[] = Array.from({ length: 36 }).map((_, i) => ({
  id: `A${5000 + i}`,
  patientId: patients[i % patients.length].id,
  doctorId: doctors[i % doctors.length].id,
  department: doctors[i % doctors.length].department,
  date: i < 18 ? todayISO : `2025-${String(((i % 11) + 1)).padStart(2, "0")}-${String(((i % 27) + 1)).padStart(2, "0")}`,
  time: `${9 + (i % 9)}:${i % 2 === 0 ? "00" : "30"}`,
  status: (["Scheduled", "Checked In", "In Consultation", "Completed", "Cancelled"] as const)[i % 5],
  token: (i % 30) + 1,
  type: i % 3 === 0 ? "Follow-up" : "New",
}));

export const beds: Bed[] = Array.from({ length: 48 }).map((_, i) => {
  const ward = (["ICU", "General", "Private", "Semi-Private", "Pediatric", "Maternity"] as const)[i % 6];
  const statuses = ["Available", "Occupied", "Cleaning", "Reserved"] as const;
  const status = statuses[i % 4];
  return {
    id: `B${i + 1}`,
    number: `${ward[0]}-${100 + i}`,
    ward,
    status,
    patientId: status === "Occupied" ? patients[i % patients.length].id : undefined,
    charge: ward === "ICU" ? 5000 : ward === "Private" ? 3000 : 1200,
  };
});

const medNames = ["Paracetamol", "Amoxicillin", "Ibuprofen", "Cetirizine", "Metformin", "Atorvastatin", "Omeprazole", "Azithromycin", "Pantoprazole", "Losartan", "Aspirin", "Salbutamol", "Insulin Glargine", "Levothyroxine", "Amlodipine", "Ciprofloxacin"];
export const medicines: Medicine[] = medNames.map((name, i) => ({
  id: `M${200 + i}`,
  name,
  brand: pick(["Cipla", "Sun Pharma", "Dr Reddy", "Lupin", "Zydus", "Pfizer"], i),
  category: pick(["Tablet", "Capsule", "Syrup", "Injection", "Inhaler"], i),
  batch: `BT-${2024}${String(i).padStart(3, "0")}`,
  expiry: `2026-${String(((i % 12) + 1)).padStart(2, "0")}-15`,
  stock: 5 + Math.floor(seed(i * 17) * 500),
  price: 10 + Math.floor(seed(i * 19) * 400),
  unit: "Strip",
}));

export const labTests: LabTest[] = Array.from({ length: 28 }).map((_, i) => ({
  id: `L${300 + i}`,
  patientId: patients[i % patients.length].id,
  test: pick(["CBC", "LFT", "KFT", "HbA1c", "Lipid Profile", "TSH", "Urine Routine", "Blood Sugar"], i),
  category: (["Hematology", "Biochemistry", "Microbiology", "Pathology"] as const)[i % 4],
  status: (["Booked", "Sample Collected", "Processing", "Completed"] as const)[i % 4],
  bookedOn: `2025-${String(1 + (i % 11)).padStart(2, "0")}-${String(1 + (i % 27)).padStart(2, "0")}`,
  price: 200 + (i % 8) * 150,
}));

export const invoices: Invoice[] = Array.from({ length: 40 }).map((_, i) => {
  const amount = 500 + Math.floor(seed(i * 23) * 9500);
  const paid = i % 3 === 0 ? amount : i % 3 === 1 ? Math.floor(amount * 0.5) : 0;
  return {
    id: `INV${7000 + i}`,
    patientId: patients[i % patients.length].id,
    type: (["OPD", "IPD", "Pharmacy", "Lab"] as const)[i % 4],
    date: `2025-${String(1 + (i % 11)).padStart(2, "0")}-${String(1 + (i % 27)).padStart(2, "0")}`,
    amount,
    paid,
    status: paid === amount ? "Paid" : paid === 0 ? "Pending" : "Partial",
    mode: (["Cash", "Card", "UPI", "Insurance"] as const)[i % 4],
  };
});

export const staff: StaffMember[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `S${i + 1}`,
  name: `${pick(firstNames, i * 2)} ${pick(lastNames, i * 4)}`,
  role: pick(["Doctor", "Nurse", "Receptionist", "Lab Technician", "Pharmacist", "Admin"], i),
  department: pick(departments, i),
  contact: `+91 9${String(700000000 + i * 211).slice(0, 9)}`,
  joined: `202${2 + (i % 3)}-0${1 + (i % 9)}-1${i % 9}`,
  salary: 25000 + i * 4500,
  status: (["Active", "On Leave", "Active", "Active", "Inactive"] as const)[i % 5],
}));

// Dashboard analytics
export const monthlyOPD = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => ({
  month: m,
  opd: 800 + Math.floor(seed(i) * 600),
  ipd: 200 + Math.floor(seed(i + 5) * 250),
}));
export const revenueData = monthlyOPD.map((m, i) => ({
  month: m.month,
  revenue: 250000 + Math.floor(seed(i * 3) * 400000),
  expense: 120000 + Math.floor(seed(i * 7) * 180000),
}));
export const collectionData = [
  { name: "Cash", value: 38, fill: "var(--chart-1)" },
  { name: "Card", value: 22, fill: "var(--chart-2)" },
  { name: "UPI", value: 30, fill: "var(--chart-3)" },
  { name: "Insurance", value: 10, fill: "var(--chart-4)" },
];
export const departmentPerf = departments.slice(0, 7).map((d, i) => ({
  dept: d,
  patients: 80 + Math.floor(seed(i * 9) * 220),
}));
export const sparkData = Array.from({ length: 12 }).map((_, i) => ({ v: 20 + Math.floor(seed(i * 13) * 80) }));

export const findPatient = (id: string) => patients.find((p) => p.id === id);
export const findDoctor = (id: string) => doctors.find((d) => d.id === id);

export const searchPatients = (q: string): Patient[] => {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return patients
    .filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.uhid.toLowerCase().includes(t) ||
        p.mobile.replace(/\s/g, "").includes(t.replace(/\s/g, "")),
    )
    .slice(0, 8);
};
