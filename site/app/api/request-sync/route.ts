import { env } from "cloudflare:workers";
import { POST as syncDrive } from "../sync-drive/route";

const COOLDOWN_MINUTES = 5;

type SyncEnvironment = {
  GOOGLE_DRIVE_SYNC_SECRET: string;
};

export async function POST() {
  try {
    const lock = await env.DB.prepare(
      `UPDATE sync_control
       SET last_requested_at = CURRENT_TIMESTAMP, last_status = 'running'
       WHERE id = 1
         AND datetime(last_requested_at) <= datetime('now', '-${COOLDOWN_MINUTES} minutes')
       RETURNING last_requested_at`,
    ).first<{ last_requested_at: string }>();

    if (!lock) {
      return Response.json(
        { error: "Uma atualização já foi solicitada recentemente. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(COOLDOWN_MINUTES * 60) } },
      );
    }

    const runtime = env as unknown as SyncEnvironment;
    const response = await syncDrive(
      new Request("https://internal/api/sync-drive", {
        method: "POST",
        headers: { "x-sync-secret": runtime.GOOGLE_DRIVE_SYNC_SECRET },
      }),
    );
    const payload = await response.json();
    await env.DB.prepare(
      `UPDATE sync_control
       SET last_completed_at = CURRENT_TIMESTAMP, last_status = ?
       WHERE id = 1`,
    )
      .bind(response.ok ? "success" : "error")
      .run();

    return Response.json(payload, { status: response.status });
  } catch (error) {
    console.error("Manual Google Drive synchronization failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha na atualização." },
      { status: 500 },
    );
  }
}
