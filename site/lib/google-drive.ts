type DriveCredentials = {
  clientEmail: string;
  privateKey: string;
  tokenUri: string;
};

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
};

function base64Url(value: string | ArrayBuffer) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemBytes(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n");
  const body = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function getDriveAccessToken(credentials: DriveCredentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: credentials.clientEmail,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: credentials.tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(credentials.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetch(credentials.tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth respondeu ${response.status}.`);
  const payloadResponse = (await response.json()) as { access_token?: string };
  if (!payloadResponse.access_token) throw new Error("Google OAuth não retornou um token.");
  return payloadResponse.access_token;
}

async function driveJson<T>(accessToken: string, url: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Google Drive respondeu ${response.status}.`);
  return (await response.json()) as T;
}

export async function listDriveFolder(accessToken: string, folderId: string) {
  const files: DriveFile[] = [];
  let pageToken = "";
  do {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const fields = encodeURIComponent(
      "nextPageToken,files(id,name,mimeType,modifiedTime)",
    );
    const page = await driveJson<{ nextPageToken?: string; files?: DriveFile[] }>(
      accessToken,
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1000&orderBy=name${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
      }`,
    );
    files.push(...(page.files ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return files;
}

export async function downloadDriveFile(accessToken: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) throw new Error(`Download do Google Drive respondeu ${response.status}.`);
  return response.arrayBuffer();
}
