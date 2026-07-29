import * as XLSX from "xlsx";

export type StockRow = {
  store: string;
  code: string;
  product: string;
  quantity: number;
  cost: number;
};

type SheetRecord = Record<string, unknown>;

function numberFrom(value: unknown) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function phoneModelName(product: string) {
  const text = product.toUpperCase();
  const patterns: Array<[RegExp, string]> = [
    [/REALME\s+12\s+PRO\s*\+\s+5G/, "Realme 12 Pro+ 5G"],
    [/REALME\s+14\s+5G/, "Realme 14 5G"],
    [/REALME\s+C71\s+5G/, "Realme C71 5G"],
    [/REALME\s+C71\s+4G/, "Realme C71 4G"],
    [/REALME\s+C85\s+4G/, "Realme C85 4G"],
    [/REALME\s+NOTE\s+70\s+4G/, "Realme Note 70 4G"],
    [/INFINIX\s+HOT\s+60I/, "Infinix Hot 60i"],
    [/INFINIX\s+SMART\s+10/, "Infinix Smart 10"],
    [/HONOR\s+X5B\s+PLUS\s+4G/, "Honor X5B Plus 4G"],
    [/HONOR\s+X6B\s+5G/, "Honor X6B 5G"],
    [/HONOR\s+X7D\s+5G/, "Honor X7D 5G"],
    [/REDMI\s+NOTE\s+15\s+PRO\s+5G/, "Xiaomi Redmi Note 15 Pro 5G"],
    [/REDMI\s+NOTE\s+14\s+4G/, "Xiaomi Redmi Note 14 4G"],
    [/REDMI\s+14C\s+4G/, "Xiaomi Redmi 14C 4G"],
    [/POCO\s+M8\s+5G/, "Xiaomi Poco M8 5G"],
    [/POCO\s+X7\s+5G/, "Xiaomi Poco X7 5G"],
    [/POCO\s+X8\s+PRO\s+5G/, "Xiaomi Poco X8 Pro 5G"],
  ];
  return (
    patterns.find(([pattern]) => pattern.test(text))?.[1] ??
    product.replace(/^Celular\s+/i, "").split(/\s+/).slice(0, 5).join(" ")
  );
}

export function isPhoneProduct(product: string) {
  const text = product.trim().toUpperCase();
  if (
    /PEL[IÍ]CULA|CARREGADOR|CABO|FONE|HEADSET|SMARTWATCH|SMART WATCH|\bWATCH\b/.test(
      text,
    )
  ) {
    return false;
  }
  return /^(CELULAR\s+)?(REALME|INFINIX|XIAOMI|REDMI|POCO|HONOR)\b/.test(text);
}

export function parseStockWorkbook(buffer: ArrayBuffer, store: string): StockRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const sourceRows = XLSX.utils.sheet_to_json<SheetRecord>(sheet, {
    defval: "",
    raw: true,
  });

  return sourceRows
    .map((row) => ({
      store,
      code: String(row["CÓD"] ?? row.COD ?? "").trim(),
      product: String(row.PROD ?? "").trim(),
      quantity: numberFrom(row["QUANT."] ?? row.QUANT),
      cost: numberFrom(row["TOTAL CUSTO"]),
    }))
    .filter(
      (row) =>
        row.code &&
        row.quantity > 0 &&
        isPhoneProduct(row.product),
    );
}
