"use client";

import { useState } from "react";

export function CopyInvoiceLinkButton({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = new URL(href, window.location.origin).toString();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className="button secondary" type="button" onClick={copyLink} style={{ fontSize: "12px", padding: "4px 10px" }}>
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}
