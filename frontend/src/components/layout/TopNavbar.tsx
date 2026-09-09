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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useSearchStore } from "@/store/searchStore";
import { searchPatients, type Patient } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  onMenu: () => void;
  onPatientSelect: (p: Patient) => void;
  onCommandOpen: () => void;
}

export function TopNavbar({ onMenu, onPatientSelect, onCommandOpen }: Props) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const { user, logout } = useAuthStore();
  const { recent, addRecent, clear } = useSearchStore();
  const navigate = useNavigate();

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
    setLoading(true);
    const id = setTimeout(() => {
      setDebounced(q);
      setLoading(false);
    }, 220);
    return () => clearTimeout(id);
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

  const results = debounced ? searchPatients(debounced) : [];

  const handleSelect = (p: Patient) => {
    addRecent(p.name);
    setOpen(false);
    setQ("");
    onPatientSelect(p);
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass-strong border-b border-border">
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
              placeholder="Search by UHID, name, or mobile…"
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
                              {p.uhid} • {p.gender} • {p.age}y • {p.mobile}
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
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-sm flex items-center gap-2"
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

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="relative">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

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
            <DropdownMenuItem><User className="h-4 w-4 mr-2" /> Profile</DropdownMenuItem>
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
    </header>
  );
}

// no-op export to silence unused
export const _x = X;
