import fs from "node:fs";
import crypto from "node:crypto";

const [credentialsPath, folderId] = process.argv.slice(2);
if (!credentialsPath || !folderId) process.exit(2);

const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
  iss: credentials.client_email,
  scope: "https://www.googleapis.com/auth/drive.readonly",
  aud: credentials.token_uri,
  iat: now,
  exp: now + 3600,
})}`;
const assertion = `${unsigned}.${crypto
  .sign("RSA-SHA256", Buffer.from(unsigned), credentials.private_key)
  .toString("base64url")}`;

const tokenResponse = await fetch(credentials.token_uri, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }),
});
if (!tokenResponse.ok) throw new Error(`Token ${tokenResponse.status}`);
const { access_token: accessToken } = await tokenResponse.json();
const headers = { Authorization: `Bearer ${accessToken}` };

const folderResponse = await fetch(
  `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,capabilities(canListChildren,canDownload)`,
  { headers },
);
if (!folderResponse.ok) throw new Error(`Pasta ${folderResponse.status}`);
const folder = await folderResponse.json();

const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
const listResponse = await fetch(
  `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime)&orderBy=name`,
  { headers },
);
if (!listResponse.ok) throw new Error(`Lista ${listResponse.status}`);
const list = await listResponse.json();

console.log(
  JSON.stringify({
    folder: folder.name,
    canList: folder.capabilities?.canListChildren,
    children: (list.files ?? []).map((file) => file.name),
  }),
);
