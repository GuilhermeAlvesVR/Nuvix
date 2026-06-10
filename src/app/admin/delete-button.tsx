"use client";

import { deleteWorkspace } from "./actions";

export function DeleteWorkspaceButton({ workspaceName, workspaceId }: {
  workspaceName: string;
  workspaceId: string;
}) {
  return (
    <form action={deleteWorkspace} onSubmit={(e) => {
      if (!confirm(`Excluir "${workspaceName}" permanentemente? Todos os dados serão perdidos.`)) e.preventDefault();
    }}>
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <button className="button secondary" type="submit"
        style={{ fontSize: "12px", padding: "4px 10px", color: "var(--danger-fg, #e00)", borderColor: "var(--danger-bg, #fdd)" }}>
        Excluir
      </button>
    </form>
  );
}
