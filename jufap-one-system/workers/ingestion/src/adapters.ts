import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { IngestionConfig } from "./config";
import { requireGraphSettings } from "./config";
import { GraphClient } from "./graph-client";
import type { ChangeSet, SourceAdapter, SourceConfiguration, SourceFile } from "./types";

function wildcardExpression(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`, "i");
}

async function recursiveFiles(root: string): Promise<string[]> {
  const result: string[] = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...await recursiveFiles(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

class DisabledAdapter implements SourceAdapter {
  async listChanges(_cursor: string | null): Promise<ChangeSet> {
    return { files: [], nextCursor: null };
  }

  async download(_file: SourceFile): Promise<Buffer> {
    throw new Error("A ingestão está desabilitada.");
  }
}

class LocalAdapter implements SourceAdapter {
  private readonly sourceRoot: string;
  private readonly pattern: RegExp;

  constructor(root: string, private readonly source: SourceConfiguration) {
    this.sourceRoot = resolve(root, source.pathPrefix);
    this.pattern = wildcardExpression(source.filePattern);
  }

  async listChanges(_cursor: string | null): Promise<ChangeSet> {
    const files = await recursiveFiles(this.sourceRoot);
    const selected: SourceFile[] = [];
    for (const filePath of files) {
      const fileName = filePath.split(/[\\/]/).at(-1) ?? filePath;
      if (!this.pattern.test(fileName)) continue;
      const metadata = await stat(filePath);
      const id = createHash("sha256").update(filePath).digest("hex");
      selected.push({
        id,
        name: fileName,
        path: relative(resolve(this.sourceRoot, ".."), filePath).replaceAll("\\", "/"),
        mimeType: null,
        sizeBytes: metadata.size,
        etag: `${metadata.size}-${metadata.mtimeMs}`,
        ctag: null,
        modifiedAt: metadata.mtime.toISOString(),
        deleted: false,
        downloadUrl: filePath,
      });
    }
    return { files: selected, nextCursor: new Date().toISOString() };
  }

  async download(file: SourceFile): Promise<Buffer> {
    if (!file.downloadUrl) throw new Error(`Caminho local ausente para ${file.path}.`);
    return readFile(file.downloadUrl);
  }
}

class GraphAdapter implements SourceAdapter {
  private readonly client: GraphClient;
  private readonly pattern: RegExp;

  constructor(settings: ReturnType<typeof requireGraphSettings>, private readonly source: SourceConfiguration) {
    this.client = new GraphClient(settings);
    this.pattern = wildcardExpression(source.filePattern);
  }

  async listChanges(cursor: string | null): Promise<ChangeSet> {
    const changes = await this.client.listChanges(this.source.pathPrefix, cursor);
    return {
      ...changes,
      files: changes.files.filter((file) => file.deleted || this.pattern.test(file.name)),
    };
  }

  async download(file: SourceFile): Promise<Buffer> {
    return this.client.download(file);
  }
}

export function createSourceAdapter(
  config: IngestionConfig,
  source: SourceConfiguration,
): SourceAdapter {
  if (config.INGESTION_MODE === "local") return new LocalAdapter(config.LOCAL_SOURCE_ROOT, source);
  if (config.INGESTION_MODE === "graph") return new GraphAdapter(requireGraphSettings(config), source);
  return new DisabledAdapter();
}
