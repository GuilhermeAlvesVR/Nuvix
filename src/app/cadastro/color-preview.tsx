"use client";

export function ColorPreview({ primary, accent, background }: {
  primary: string;
  accent: string;
  background: string;
}) {
  return (
    <div className="color-preview-widget">
      <div className="color-preview-header">
        <strong>Prévia</strong>
        <span className="muted-text">As cores escolhidas</span>
      </div>
      <div className="color-preview-panel" style={{ background, borderColor: `color-mix(in srgb, ${primary} 30%, transparent)` }}>
        <div className="color-preview-navbar" style={{ background: primary }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Nuvix</span>
          <span className="color-preview-avatar" style={{ background: accent }} />
        </div>
        <div className="color-preview-body">
          <div className="color-preview-badge" style={{ background: primary, color: "#fff" }}>
            Preview
          </div>
          <div className="color-preview-card">
            <div className="color-preview-line primary-line" style={{ background: primary }} />
            <div className="color-preview-line accent-line" style={{ background: accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}
