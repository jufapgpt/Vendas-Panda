import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { salesBatches, stockBatches } from "../../../db/schema";
import {
  downloadDriveFile,
  getDriveAccessToken,
  listDriveFolder,
  type DriveFile,
} from "../../../lib/google-drive";
import { POST as importSales } from "../upload/route";
import { POST as importStock } from "../stock/route";

type SyncEnvironment = {
  GOOGLE_DRIVE_CLIENT_EMAIL: string;
  GOOGLE_DRIVE_PRIVATE_KEY: string;
  GOOGLE_DRIVE_TOKEN_URI: string;
  GOOGLE_DRIVE_ROOT_FOLDER_ID: string;
  GOOGLE_DRIVE_SYNC_SECRET: string;
};

function configuredEnvironment() {
  const runtime = env as unknown as SyncEnvironment;
  const required = [
    runtime.GOOGLE_DRIVE_CLIENT_EMAIL,
    runtime.GOOGLE_DRIVE_PRIVATE_KEY,
    runtime.GOOGLE_DRIVE_TOKEN_URI,
    runtime.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    runtime.GOOGLE_DRIVE_SYNC_SECRET,
  ];
  if (required.some((value) => !value)) {
    throw new Error("A integração com o Google Drive ainda não está configurada.");
  }
  return runtime;
}

function authorized(request: Request, runtime: SyncEnvironment) {
  const authorization = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-sync-secret") ?? "";
  return (
    authorization === `Bearer ${runtime.GOOGLE_DRIVE_SYNC_SECRET}` ||
    headerSecret === runtime.GOOGLE_DRIVE_SYNC_SECRET
  );
}

async function findSubfolder(accessToken: string, rootId: string, name: string) {
  const items = await listDriveFolder(accessToken, rootId);
  return items.find(
    (item) =>
      item.mimeType === "application/vnd.google-apps.folder" &&
      item.name.localeCompare(name, "pt-BR", { sensitivity: "base" }) === 0,
  );
}

async function alreadyImportedSales(file: DriveFile) {
  const db = getDb();
  const [existing] = await db
    .select({ id: salesBatches.id })
    .from(salesBatches)
    .where(
      and(
        eq(salesBatches.sourceId, file.id),
        eq(salesBatches.sourceModifiedAt, file.modifiedTime),
        eq(salesBatches.isActive, true),
      ),
    )
    .limit(1);
  return Boolean(existing);
}

async function alreadyImportedStock(file: DriveFile) {
  const db = getDb();
  const [existing] = await db
    .select({ id: stockBatches.id })
    .from(stockBatches)
    .where(
      and(
        eq(stockBatches.sourceId, file.id),
        eq(stockBatches.sourceModifiedAt, file.modifiedTime),
      ),
    )
    .orderBy(desc(stockBatches.id))
    .limit(1);
  return Boolean(existing);
}

async function syncSales(accessToken: string, files: DriveFile[]) {
  const candidates = files
    .filter((file) => /^\d{4}-\d{2}\.xlsx$/i.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  const imported: string[] = [];
  const unchanged: string[] = [];

  for (const file of candidates) {
    if (await alreadyImportedSales(file)) {
      unchanged.push(file.name);
      continue;
    }
    const bytes = await downloadDriveFile(accessToken, file.id);
    const formData = new FormData();
    formData.set(
      "file",
      new File([bytes], file.name, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    formData.set("sourceId", file.id);
    formData.set("sourceModifiedAt", file.modifiedTime);
    formData.set("sourceKind", "drive");
    const response = await importSales(
      new Request("https://internal/api/upload", { method: "POST", body: formData }),
    );
    if (!response.ok) {
      const detail = (await response.json()) as { error?: string };
      throw new Error(detail.error ?? `Falha ao importar ${file.name}.`);
    }
    imported.push(file.name);
  }
  return { imported, unchanged };
}

async function syncStocks(accessToken: string, files: DriveFile[]) {
  const light = files.find((file) => /^light\.xlsx$/i.test(file.name));
  const boavista = files.find((file) => /^boa[\s_-]*vista\.xlsx$/i.test(file.name));
  if (!light || !boavista) {
    throw new Error("A pasta Estoques deve conter Light.xlsx e Boavista.xlsx.");
  }
  if ((await alreadyImportedStock(light)) && (await alreadyImportedStock(boavista))) {
    return { imported: [], unchanged: [light.name, boavista.name] };
  }

  const [lightBytes, boavistaBytes] = await Promise.all([
    downloadDriveFile(accessToken, light.id),
    downloadDriveFile(accessToken, boavista.id),
  ]);
  const formData = new FormData();
  for (const [file, bytes] of [
    [light, lightBytes],
    [boavista, boavistaBytes],
  ] as const) {
    formData.append(
      "files",
      new File([bytes], file.name, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
  }
  formData.set("sourceKind", "drive");
  formData.set(
    "sourceMetadata",
    JSON.stringify({
      [light.name]: { id: light.id, modifiedTime: light.modifiedTime },
      [boavista.name]: { id: boavista.id, modifiedTime: boavista.modifiedTime },
    }),
  );
  const response = await importStock(
    new Request("https://internal/api/stock", { method: "POST", body: formData }),
  );
  if (!response.ok) {
    const detail = (await response.json()) as { error?: string };
    throw new Error(detail.error ?? "Falha ao importar os estoques.");
  }
  return { imported: [light.name, boavista.name], unchanged: [] };
}

export async function POST(request: Request) {
  try {
    const runtime = configuredEnvironment();
    if (!authorized(request, runtime)) {
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    }

    const accessToken = await getDriveAccessToken({
      clientEmail: runtime.GOOGLE_DRIVE_CLIENT_EMAIL,
      privateKey: runtime.GOOGLE_DRIVE_PRIVATE_KEY,
      tokenUri: runtime.GOOGLE_DRIVE_TOKEN_URI,
    });
    const [salesFolder, stockFolder] = await Promise.all([
      findSubfolder(accessToken, runtime.GOOGLE_DRIVE_ROOT_FOLDER_ID, "Vendas"),
      findSubfolder(accessToken, runtime.GOOGLE_DRIVE_ROOT_FOLDER_ID, "Estoques"),
    ]);
    if (!salesFolder || !stockFolder) {
      throw new Error("Não encontrei as subpastas Vendas e Estoques.");
    }
    const [salesFiles, stockFiles] = await Promise.all([
      listDriveFolder(accessToken, salesFolder.id),
      listDriveFolder(accessToken, stockFolder.id),
    ]);
    const sales = await syncSales(accessToken, salesFiles);
    const stocks = await syncStocks(accessToken, stockFiles);

    return Response.json({
      syncedAt: new Date().toISOString(),
      sales,
      stocks,
    });
  } catch (error) {
    console.error("Google Drive synchronization failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha na sincronização." },
      { status: 500 },
    );
  }
}
