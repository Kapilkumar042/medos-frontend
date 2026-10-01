import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Check, ImagePlus, Loader2, MapPin, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ALL_MODULES, type ModuleKey, useAuthStore } from "@/store/authStore";
import {
  getHospitalProfile,
  resolveHospitalAssetUrl,
  updateHospitalProfile,
} from "@/api/hospitalApi";

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  const setHospital = useAuthStore((state) => state.setHospital);
  const [hospitalName, setHospitalName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : logoUrl), [logoFile, logoUrl]);

  useEffect(() => {
    return () => {
      if (logoFile) URL.revokeObjectURL(logoPreview);
    };
  }, [logoFile, logoPreview]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getHospitalProfile();
        const profile = response?.data ?? response;
        setHospitalName(profile?.hospital_name ?? profile?.name ?? "");
        setPhone(profile?.phone ?? "");
        setAddress(profile?.address ?? "");
        setSelectedModules(
          Array.isArray(profile?.modules)
            ? profile.modules.filter((module: string): module is ModuleKey =>
                ALL_MODULES.includes(module as ModuleKey),
              )
            : [],
        );
        const profileLogo = resolveHospitalAssetUrl(profile?.logo_image ?? profile?.logo);
        setLogoUrl(profileLogo);
        setHospital({
          name: profile?.hospital_name ?? profile?.name ?? "",
          email: profile?.hospital_email ?? profile?.email ?? "",
          phone: profile?.phone ?? "",
          address: profile?.address ?? "",
          logo: profileLogo,
          modules: Array.isArray(profile?.modules) ? profile.modules : [],
          registeredAt: profile?.created_at ?? new Date().toISOString(),
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load hospital profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const toggleModule = (module: ModuleKey) => {
    setSelectedModules((current) =>
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module],
    );
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hospitalName.trim()) {
      toast.error("Hospital name is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("hospital_name", hospitalName.trim());
      formData.append("phone", phone.trim());
      formData.append("address", address.trim());
      formData.append("modules", JSON.stringify(selectedModules));

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await updateHospitalProfile(formData);
      const profile = response?.data ?? response;
      const updatedLogo = resolveHospitalAssetUrl(profile?.logo_image ?? profile?.logo_url ?? profile?.logo);
      if (updatedLogo) setLogoUrl(updatedLogo);
      setHospital((current) => ({
        name: profile?.hospital_name ?? profile?.name ?? hospitalName,
        email: profile?.hospital_email ?? profile?.email ?? current?.email ?? "",
        phone: profile?.phone ?? phone,
        address: profile?.address ?? address,
        logo: updatedLogo ?? current?.logo,
        modules: profile?.modules ?? selectedModules,
        registeredAt: current?.registeredAt ?? new Date().toISOString(),
      }));
      setLogoFile(null);
      toast.success("Hospital profile updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update hospital profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Hospital Profile" />

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Hospital details</CardTitle>
              <CardDescription>Keep the information shown across your hospital workspace up to date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="space-y-2 text-sm font-medium">
                <span>Hospital name</span>
                <Input value={hospitalName} onChange={(event) => setHospitalName(event.target.value)} placeholder="Enter hospital name" />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Phone</span>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Hospital phone number" />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Address</span>
                <Textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Hospital address" rows={4} />
              </label>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Enabled modules</div>
                  <p className="text-sm text-muted-foreground">Choose the modules available to your hospital.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ALL_MODULES.map((module) => (
                    <label key={module} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40">
                      <Checkbox checked={selectedModules.includes(module)} onCheckedChange={() => toggleModule(module)} />
                      <span className="text-sm">{module}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Hospital logo</CardTitle>
              <CardDescription>Upload a logo for hospital branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex aspect-square max-h-64 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">
                {logoPreview ? (
                  <img src={logoPreview} alt="Hospital logo preview" className="h-full w-full object-contain p-6" />
                ) : (
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40">
                <ImagePlus className="h-4 w-4" />Choose logo
                <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />{selectedModules.length} modules enabled
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
