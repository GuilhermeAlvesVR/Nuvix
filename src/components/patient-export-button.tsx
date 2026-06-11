"use client";

import { useCallback, useState } from "react";
import { exportPatientData } from "@/app/app/pacientes/actions";

type Props = {
  patientId: string;
  patientName: string;
};

export function PatientExportButton({ patientId, patientName }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const base64 = await exportPatientData(patientId);
      const json = atob(base64);
      const blob = new Blob(["\ufeff" + json], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dados-${patientName.replace(/\s+/g, "-").toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }, [patientId, patientName]);

  return (
    <button className="button secondary" type="button" onClick={handleClick} disabled={loading}>
      {loading ? "Exportando..." : "Exportar dados"}
    </button>
  );
}
