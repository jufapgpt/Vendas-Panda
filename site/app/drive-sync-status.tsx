"use client";

import { useState } from "react";

type DriveSyncStatusProps = {
  updatedAt: string;
  label?: string;
  allowManualSync?: boolean;
};

export function DriveSyncStatus({
  updatedAt,
  label = "Dados atualizados",
  allowManualSync = false,
}: DriveSyncStatusProps) {
  const [syncState, setSyncState] = useState<"idle" | "loading" | "error">("idle");
  const [syncError, setSyncError] = useState("");

  async function requestSync() {
    setSyncState("loading");
    setSyncError("");
    try {
      const response = await fetch("/api/request-sync", { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível atualizar agora.");
      }
      window.location.reload();
    } catch (error) {
      setSyncState("error");
      setSyncError(
        error instanceof Error ? error.message : "Não foi possível atualizar agora.",
      );
    }
  }

  return (
    <div className="topbar-actions">
      <div className="drive-sync-status">
        <span className="drive-sync-state">
          <span className="drive-sync-dot" aria-hidden="true" />
          Google Drive automático
        </span>
        <span className="updated">
          {label} em {updatedAt} · sincroniza a cada hora
        </span>
      </div>
      {allowManualSync && (
        <div className="manual-sync-wrap">
          <button
            className="manual-sync-button"
            type="button"
            onClick={requestSync}
            disabled={syncState === "loading"}
          >
            <span aria-hidden="true">↻</span>
            {syncState === "loading"
              ? "Atualizando…"
              : syncState === "error"
                ? "Tentar novamente"
                : "Atualizar agora"}
          </button>
          {syncError && (
            <span className="manual-sync-error" role="status">
              {syncError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
