import type { ChangeSet, SourceFile } from "./types";

interface GraphSettings {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  driveId: string;
}

interface GraphDriveItem {
  id: string;
  name: string;
  size?: number;
  eTag?: string;
  cTag?: string;
  lastModifiedDateTime?: string;
  deleted?: Record<string, unknown>;
  file?: { mimeType?: string };
  folder?: Record<string, unknown>;
  parentReference?: { path?: string };
  "@microsoft.graph.downloadUrl"?: string;
}

interface GraphCollection {
  value: GraphDriveItem[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

function encodedPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function itemPath(item: GraphDriveItem): string {
  const parent = item.parentReference?.path ?? "";
  const relativeParent = parent.replace(/^\/drive\/root:/, "").replace(/^\/drives\/[^/]+\/root:/, "");
  return [relativeParent, item.name].filter(Boolean).join("/").replace(/\/{2,}/g, "/");
}

async function responseError(response: Response, context: string): Promise<Error> {
  const body = (await response.text()).slice(0, 500);
  return new Error(`${context}: Microsoft Graph respondeu ${response.status}. ${body}`);
}

export class GraphClient {
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly settings: GraphSettings) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;

    const body = new URLSearchParams({
      client_id: this.settings.clientId,
      client_secret: this.settings.clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });
    const response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(this.settings.tenantId)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!response.ok) throw await responseError(response, "Falha de autenticação");
    const payload = await response.json() as TokenResponse;
    this.token = {
      value: payload.access_token,
      expiresAt: Date.now() + Math.max(60, payload.expires_in - 120) * 1000,
    };
    return this.token.value;
  }

  private deltaUrl(pathPrefix: string): string {
    const drive = encodeURIComponent(this.settings.driveId);
    const path = encodedPath(pathPrefix);
    return path
      ? `https://graph.microsoft.com/v1.0/drives/${drive}/root:/${path}:/delta`
      : `https://graph.microsoft.com/v1.0/drives/${drive}/root/delta`;
  }

  async listChanges(pathPrefix: string, cursor: string | null): Promise<ChangeSet> {
    const token = await this.accessToken();
    let url: string | undefined = cursor ?? this.deltaUrl(pathPrefix);
    const files: SourceFile[] = [];
    let nextCursor: string | null = cursor;

    while (url) {
      const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
      if (!response.ok) throw await responseError(response, "Falha ao consultar alterações");
      const payload = await response.json() as GraphCollection;
      for (const item of payload.value) {
        if (item.folder) continue;
        files.push({
          id: item.id,
          name: item.name,
          path: itemPath(item),
          mimeType: item.file?.mimeType ?? null,
          sizeBytes: item.size ?? null,
          etag: item.eTag ?? null,
          ctag: item.cTag ?? null,
          modifiedAt: item.lastModifiedDateTime ?? null,
          deleted: Boolean(item.deleted),
          downloadUrl: item["@microsoft.graph.downloadUrl"] ?? null,
        });
      }
      nextCursor = payload["@odata.deltaLink"] ?? nextCursor;
      url = payload["@odata.nextLink"];
    }

    return { files, nextCursor };
  }

  async download(file: SourceFile): Promise<Buffer> {
    if (file.deleted) throw new Error(`O item ${file.path} foi excluído e não pode ser baixado.`);
    if (file.downloadUrl) {
      const response = await fetch(file.downloadUrl);
      if (!response.ok) throw await responseError(response, `Falha ao baixar ${file.path}`);
      return Buffer.from(await response.arrayBuffer());
    }

    const token = await this.accessToken();
    const drive = encodeURIComponent(this.settings.driveId);
    const itemId = encodeURIComponent(file.id);
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${drive}/items/${itemId}/content`,
      { headers: { authorization: `Bearer ${token}` }, redirect: "follow" },
    );
    if (!response.ok) throw await responseError(response, `Falha ao baixar ${file.path}`);
    return Buffer.from(await response.arrayBuffer());
  }
}
