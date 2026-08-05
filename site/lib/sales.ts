import * as XLSX from "xlsx";
import { inferProductCategory } from "./categories";

export type SaleRow = {
  store: string;
  date: string;
  order: string;
  code: string;
  product: string;
  category: string;
  type: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cost: number;
  seller: string;
  payment: string;
  priceType: string;
};

type SheetRecord = Record<string, unknown>;

function numberFrom(value: unknown) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateFrom(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }
  const match = String(value ?? "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return match
    ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
    : "";
}

export function inferCategory(product: unknown, code: unknown) {
  return inferProductCategory(product, code);
}

export function parseWorkbook(buffer: ArrayBuffer): SaleRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const sourceRows = XLSX.utils.sheet_to_json<SheetRecord>(sheet, {
    defval: "",
    raw: true,
  });

  return sourceRows
    .filter((row) => row.EMPRESA && row.TIPO)
    .map((row) => {
      const type = String(row.TIPO).trim().toLowerCase();
      const isReturn = type.includes("devol");
      const product = String(row.PROD ?? "").trim();
      const code = String(row.COD ?? "").trim();
      const quantity = Math.abs(numberFrom(row.QUANT));
      const unitPrice = Math.abs(numberFrom(row.PRECO));
      return {
        store: String(row.EMPRESA).trim(),
        date: dateFrom(row.DATA),
        order: String(row.PEDIDO ?? "").trim(),
        code,
        product,
        category: inferCategory(product, code),
        type,
        quantity: isReturn ? -quantity : quantity,
        unitPrice: isReturn ? -unitPrice : unitPrice,
        total: numberFrom(row.TOTAL),
        cost: numberFrom(row.CUSTO),
        seller: String(row.VENDEDOR ?? "").trim(),
        payment:
          String(row["FORMA PAGAMENTO"] ?? "").trim() || "Não informado",
        priceType: String(row["TIPO PREÇO"] ?? "").trim(),
      };
    })
    .filter((row) => row.date && row.product && Math.abs(row.quantity) > 0);
}
