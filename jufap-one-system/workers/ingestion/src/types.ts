export interface SourceConfiguration {
  code: string;
  name: string;
  domain: string;
  operation: string | null;
  pathPrefix: string;
  filePattern: string;
  sheetNames: string[];
  expectedGrain: string;
  keyColumns: string[];
  dateColumns: string[];
  frequency: "intraday" | "daily" | "weekly" | "monthly" | "on_demand";
  owner: string | null;
  sensitivity: "public" | "internal" | "restricted";
  enabled: boolean;
}

export interface SourceFile {
  id: string;
  name: string;
  path: string;
  mimeType: string | null;
  sizeBytes: number | null;
  etag: string | null;
  ctag: string | null;
  modifiedAt: string | null;
  deleted: boolean;
  downloadUrl: string | null;
}

export interface ChangeSet {
  files: SourceFile[];
  nextCursor: string | null;
}

export interface SourceAdapter {
  listChanges(cursor: string | null): Promise<ChangeSet>;
  download(file: SourceFile): Promise<Buffer>;
}

export interface ParsedRecord {
  sheetName: string | null;
  rowNumber: number;
  payload: Record<string, unknown>;
}

export interface FileProcessResult {
  rowsReceived: number;
  rowsValid: number;
  rowsRejected: number;
}
