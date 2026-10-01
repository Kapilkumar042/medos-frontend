import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings/users")({
  component: UsersPage,
});

type UserItem = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
};

function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DOCTOR");

  // prefer token from store if available, fallback to localStorage
  const tokenFromStore = useAuthStore.getState()?.token as string | undefined;
  const token = tokenFromStore || localStorage.getItem("authToken") || "";

  const base = import.meta.env.VITE_APP_API_URL ?? "";

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await axios.get(`${base}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data?.users ?? res.data ?? []);
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load users";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Name, email and password are required");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        full_name: fullName,
        email,
        phone,
        password,
        role,
      };
      await axios.post(`${base}/users`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      toast.success("User created", {
  duration: 500,
});
      setShowModal(false);
      // reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("DOCTOR");
      // refresh list
      await fetchUsers();
    } catch (err: any) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Creation failed";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">Manage system users and roles.</p>
        </div>
        <div>
          <Button onClick={() => setShowModal(true)}>Add User</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-sm text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.full_name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.phone ?? "-"}</td>
                    <td className="p-3">{u.role ?? "-"}</td>
                    <td className="p-3">
                      <Button
                        onClick={() => navigate({ to: "/settings/edit" })}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple modal (unstyled) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-card border p-6">
            <h3 className="text-lg font-medium mb-2">Add user</h3>
            <form onSubmit={handleCreate} className="grid gap-3">
              <div>
                <Label>Full name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full mt-1 border rounded-md p-2 bg-transparent"
                >
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="NURSE">NURSE</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create user"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
