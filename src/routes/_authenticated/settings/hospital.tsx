import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Building2, CheckCircle2, Facebook, Instagram, Link2, Save } from "lucide-react";
import { toast } from "sonner";

import api from "@/api/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/settings/hospital")({
  component: HospitalSetupPage,
});

type HospitalSettings = {
  hospitalName: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  brandColor: string;
};

function HospitalSetupPage() {
  const [settings, setSettings] = useState<HospitalSettings>({
    hospitalName: "",
    phone: "",
    email: "",
    address: "",
    logoUrl: "",
    brandColor: "#167d72",
  });
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const update = (key: keyof HospitalSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      await api.put("/hospitals/me/settings", settings);
      toast.success("Hospital settings saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save hospital settings");
    } finally {
      setSaving(false);
    }
  };

  const connectMeta = async () => {
    setConnecting(true);

    try {
      const response = await api.get("/integrations/meta/connect-url");
      window.location.assign(response.data.url);
    } catch (error) {
      console.error(error);
      toast.error("Could not start Meta connection");
      setConnecting(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHeader
        title="Hospital Setup"
        description="Manage your hospital profile, branding, and lead integrations."
      />

      <form onSubmit={saveSettings} className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Hospital profile</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="hospitalName">Hospital name</Label>
              <Input id="hospitalName" required value={settings.hospitalName}
                onChange={(e) => update("hospitalName", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={settings.phone}
                onChange={(e) => update("phone", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={settings.email}
                onChange={(e) => update("email", e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} value={settings.address}
                onChange={(e) => update("address", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" type="url" placeholder="https://..."
                value={settings.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} />
            </div>

            <div>
              <Label htmlFor="brandColor">Brand color</Label>
              <div className="mt-1 flex h-10 items-center gap-3 rounded-md border border-input px-3">
                <input id="brandColor" aria-label="Brand color" type="color"
                  className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                  value={settings.brandColor}
                  onChange={(e) => update("brandColor", e.target.value)} />
                <span className="text-sm text-muted-foreground">{settings.brandColor}</span>
              </div>
            </div>
          </div>

          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Hospital logo preview"
              className="h-16 max-w-48 rounded border object-contain p-2" />
          )}

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Lead sources</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect Meta to import lead-form submissions into CRM Leads.
              </p>
            </div>
            <Badge variant="outline">Not connected</Badge>
          </div>

          <div className="space-y-3 rounded-md border border-border p-4">
            <div className="flex items-center gap-3">
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Facebook Lead Ads</span>
            </div>
            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-medium">Instagram Lead Ads</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            A hospital admin authorizes Meta, selects a Page and lead forms, then reviews
            the field mapping before imports are enabled. Access tokens remain on the server.
          </p>

          <Button type="button" variant="outline" className="w-full gap-2"
            disabled={connecting} onClick={connectMeta}>
            {connecting ? <CheckCircle2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {connecting ? "Opening Meta..." : "Connect Meta"}
          </Button>
        </section>
      </form>
    </main>
  );
}