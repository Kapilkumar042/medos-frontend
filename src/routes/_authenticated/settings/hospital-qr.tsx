import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { PageHeader } from "@/components/shared/PageHeader";

import { generateHospitalQR } from "@/api/hospitalApi";

import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/hospital-qr")({
  component: HospitalQRPage,
});

function HospitalQRPage() {
  const [loading, setLoading] = useState(false);

  const [qrData, setQrData] = useState<any>(null);

  const loadQr = async () => {
    try {
      setLoading(true);

      const data = await generateHospitalQR();

      setQrData(data);
    } catch (error) {
      toast.error("Unable to load QR");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQr();
  }, []);

  return (
    <>
      <PageHeader
        title="Hospital QR"
        description="Patients can scan this QR to directly book appointments."
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            {qrData?.qr_image && (
              <img
                src={`${import.meta.env.VITE_APP_API_URL}${qrData.qr_image}`}
                alt="Hospital QR"
                className="w-72 h-72 border rounded-lg"
              />
            )}

            <div className="text-center">
              <h3 className="font-semibold">Hospital Code</h3>

              <p className="text-muted-foreground">{qrData?.hospital_code}</p>
            </div>

            <div className="text-center">
              <h3 className="font-semibold">Booking URL</h3>

              <p className="text-blue-600 break-all">{qrData?.booking_url}</p>
            </div>

            <Button onClick={loadQr} disabled={loading}>
              {loading ? "Generating..." : "Generate QR"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
