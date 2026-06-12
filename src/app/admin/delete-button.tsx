"use client";

import { deleteWorkspace } from "./actions";

export function DeleteWorkspaceButton({ workspaceName, workspaceId }: {
  workspaceName: string;
  workspaceId: string;
}) {
  return (
    <form action={deleteWorkspace} onSubmit={(e) => {
      if (!confirm(`Arquivar "${workspaceName}"? A empresa sai da lista, mas os dados ficam preservados para auditoria e LGPD.`)) e.preventDefault();
    }}>
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <button className="button secondary" type="submit" style={{ color: "var(--danger-fg, #e00)", borderColor: "var(--danger-bg, #fdd)" }}>
        Arquivar
      </button>
    </form>
  );
}
