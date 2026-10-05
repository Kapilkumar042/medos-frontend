import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Command as CommandIcon,
  LogOut,
  User,
  Settings,
  Plus,
  X,
  Clock,
  IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useSearchStore } from "@/store/searchStore";
import { useOpdStore, type OpdPatient } from "@/store/opdStore";
import { cn } from "@/lib/utils";
import { resolveHospitalAssetUrl } from "@/api/hospitalApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/api/api";
import { inr } from "@/lib/format";
import { opdApi, type OpdPatientSearchResult } from "@/lib/opd-api";
interface Props {
  onMenu: () => void;
  onPatientSelect: (p: OpdPatient) => void;
  onCommandOpen: () => void;
}
type CatalogSearchItem = {
  id?: string | number;
  name?: string;
  test_name?: string;
  service_name?: string;
  medicine_name?: string;
  code?: string;
  category?: string;
  type?: string;
  price?: number | string;
  unit_price?: number | string;
  mrp?: number | string;
  unit?: string;
  status?: string;
};

export function TopNavbar({ onMenu, onPatientSelect, onCommandOpen }: Props) {
const [results, setResults] = useState<OpdPatientSearchResult[]>([]);
const [searchError, setSearchError] = useState("");
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const { user, hospital, logout } = useAuthStore();
  const { recent, addRecent, clear } = useSearchStore();
  const navigate = useNavigate();
  const hospitalLogo = resolveHospitalAssetUrl(hospital?.logo);
  const [catalogQuery, setCatalogQuery] = useState("");
const [catalogResults, setCatalogResults] = useState<CatalogSearchItem[]>([]);
const [catalogOpen, setCatalogOpen] = useState(false);
const [catalogLoading, setCatalogLoading] = useState(false);
const [catalogError, setCatalogError] = useState("");
// const catalogRef = useRef<HTMLDivElement>(null);

  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  const term = q.trim();

  if (!term) {
    setResults([]);
    setLoading(false);
    setSearchError("");
    return;
  }

  let active = true;
  setLoading(true);
  setSearchError("");

  const timeoutId = window.setTimeout(async () => {
    try {
      const patients = await opdApi.searchPatients(term);
      if (active) setResults(patients);
    } catch (error) {
      console.error("Patient search failed", error);
      if (active) {
        setResults([]);
        setSearchError("Patient search failed");
      }
    } finally {
      if (active) setLoading(false);
    }
  }, 250);

  return () => {
    active = false;
    window.clearTimeout(timeoutId);
  };
}, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onCommandOpen();
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCommandOpen]);

const query = debounced.trim().toLowerCase();

// const results = query
//   ? patients.filter(
//       (patient) =>
//         patient.name?.toLowerCase().includes(query) ||
//         patient.uhid?.toLowerCase().includes(query) ||
//         patient.mobile?.includes(query),
//     )
//   : [];

  // const handleSelect = (p: Patient) => {
  //   addRecent(p.name);
  //   setOpen(false);
  //   setQ("");
  //   onPatientSelect(p);
  // };

  useEffect(() => {
  const term = catalogQuery.trim();

  if (!term) {
    setCatalogResults([]);
    setCatalogLoading(false);
    setCatalogError("");
    return;
  }

  let active = true;
  setCatalogLoading(true);
  setCatalogError("");

  const timeoutId = window.setTimeout(async () => {
    try {
      const response = await api.get("/catalog/search", {
        params: { q: term },
      });

      const payload = response.data?.data ?? response.data;
      const results = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

      if (active) setCatalogResults(results);
    } catch (error) {
      console.error("Catalog search failed", error);
      if (active) {
        setCatalogResults([]);
        setCatalogError("Catalog search failed");
      }
    } finally {
      if (active) setCatalogLoading(false);
    }
  }, 250);

  return () => {
    active = false;
    window.clearTimeout(timeoutId);
  };
}, [catalogQuery]);
  const handleSelect = (patient: OpdPatientSearchResult) => {
  addRecent(patient.name);
  setOpen(false);
  setQ("");

  navigate({
    to: "/opd/registration",
    search: {
      edit: String(patient.id),
      billing: 1,
    } as never,
  });
};

  return (
    <header className="sticky top-0 z-30 h-16 glass-strong border-b border-border">
      <div className="h-full flex px-4 md:px-6  items-center justify-between">
      <div className="h-full px-4 md:px-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="relative flex-1 max-w-xl" ref={ref}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Global Search by UHID, name, or mobile…"
              className="w-full h-10 pl-10 pr-20 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-ring outline-none text-sm transition"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border">
              <CommandIcon className="h-3 w-3" />K
            </kbd>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 right-0 rounded-2xl glass-strong shadow-elegant border border-border overflow-hidden"
              >
                {loading && q && (
                  <div className="p-3 space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                )}
                {!loading && q && results.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="text-sm text-muted-foreground">No patients found for "{q}"</div>
                  </div>
                )}
                {!loading && results.length > 0 && (
                  <ul className="max-h-80 overflow-auto scrollbar-thin py-1">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => handleSelect(p)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 text-left transition-colors"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs gradient-teal text-white">
                              {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {p.uhid} • {p.gender} • {p.mobile}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{p.bloodGroup}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!q && recent.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-2 py-1">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Recent searches
                      </div>
                      <button onClick={clear} className="text-[11px] text-muted-foreground hover:text-foreground">
                        Clear
                      </button>
                    </div>
                    <ul className="space-y-0.5">
                      {recent.map((r) => (
                        <li key={r}>
                          <button
                            onClick={() => setQ(r)}
                            className="w-full text-left px-2 py-1.5 rounded-lg  hover:bg-muted text-sm flex items-center gap-2"
                          >
                            <Search className="h-3.5 w-3.5 text-muted-foreground" /> {r}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!q && recent.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Start typing to find patients
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
  <DialogTrigger className="bg-muted" asChild>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Search catalog"
      title="Search services, medicines, and tests"
    >
      <Search className="h-5 w-5 " />
    </Button>
  </DialogTrigger>

  <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-xl">
    <DialogHeader>
      <DialogTitle>Search Catalog</DialogTitle>
    </DialogHeader>

    <input
      autoFocus
      value={catalogQuery}
      onChange={(event) => setCatalogQuery(event.target.value)}
      placeholder="Search services, medicines, tests..."
      aria-label="Search catalog"
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />

    <div className="max-h-[55vh] min-h-24 overflow-y-auto">
      {!catalogQuery.trim() ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Enter a name or code to search the catalog.
        </p>
      ) : catalogLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Searching catalog...
        </p>
      ) : catalogError ? (
        <p className="py-6 text-center text-sm text-destructive">{catalogError}</p>
      ) : catalogResults.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No catalog items found.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {catalogResults.map((item, index) => {
            const name =
              item.name ??
              item.test_name ??
              item.service_name ??
              item.medicine_name ??
              "Catalog item";
            const price = item.price ?? item.unit_price ?? item.mrp;

            return (
              <li
                key={item.id ?? item.code ?? `${name}-${index}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[item.category ?? item.type, item.code, item.unit, item.status]
                      .filter(Boolean)
                      .join(" · ") || "Catalog item"}
                  </p>
                </div>

                {price != null && (
                  <span className="shrink-0 text-sm font-medium">
                    {inr(Number(price) || 0)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </DialogContent>
</Dialog>
</div>
 <div className="h-full px-4 md:px-6 flex items-center gap-3">
        <div className="hidden lg:flex flex-col text-right text-xs leading-tight">
          <span className="font-medium">{now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</span>
          <span className="text-muted-foreground">{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="hidden md:inline-flex gap-1.5 gradient-blue text-white border-0 hover:opacity-90">
              <Plus className="h-4 w-4" /> Quick Action
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/opd/registration" })}>New OPD Registration</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/opd/appointments" })}>Book Appointment</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/ipd/admission" })}>IPD Admission</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/lab/booking" })}>Lab Test</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/pharmacy/sales" })}>Pharmacy Sale</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* <Button variant="ghost" size="icon" onClick={toggleTheme} className="relative">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications <Badge variant="secondary" className="text-[10px]">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { t: "New OPD registration", d: "Patient UH24012 just registered", c: "text-primary" },
              { t: "Lab report ready", d: "CBC for Priya Patel completed", c: "text-success" },
              { t: "Bed reserved", d: "ICU bed I-103 reserved", c: "text-warning" },
            ].map((n, i) => (
              <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 py-2">
                <span className={cn("text-sm font-medium", n.c)}>{n.t}</span>
                <span className="text-xs text-muted-foreground">{n.d}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted rounded-xl p-1 pr-2 transition-colors">
              <Avatar className="h-8 w-8">
                {hospitalLogo && <AvatarImage src={hospitalLogo} alt={hospital?.name || "Hospital logo"} />}
                <AvatarFallback className="text-xs gradient-blue text-white">
                  {user?.name.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "DR"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-medium">{user?.name ?? "Guest"}</span>
                <span className="text-[10px] text-muted-foreground">{user?.role}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={()=> navigate({to:"/settings/profile"})}><User className="h-4 w-4 mr-2" /> Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings/users" })}>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  );
}

// no-op export to silence unused
export const _x = X;
