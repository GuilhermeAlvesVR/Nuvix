"use client";

import { useCallback, useState } from "react";

type Props = {
  label: string;
  exportAction: (data: FormData) => Promise<string>;
  filename: string;
  getFormData?: () => FormData;
};

export function ExportCSVButton({ label, exportAction, filename, getFormData }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const fd = getFormData ? getFormData() : new FormData();
      const csv = await exportAction(fd);
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }, [exportAction, filename, getFormData]);

  return (
    <button className="button secondary" type="button" onClick={handleClick} disabled={loading}>
      {loading ? "Exportando..." : label}
    </button>
  );
}
