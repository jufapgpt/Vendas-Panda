import fs from "node:fs/promises";
import * as XLSX from "xlsx";

const sourcePath =
  "C:\\Users\\marce\\Downloads\\2026-07-28-17-02-relatorio-produto-filtrar-analitica.xlsx";
const outputPath = new URL("../app/data/initial-sales.json", import.meta.url);

function numberFrom(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateFrom(value) {
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

function categoryFrom(product, code) {
  const text = `${product ?? ""} ${code ?? ""}`.toUpperCase();
  if (text.includes("PELICULA")) return "Películas";
  if (text.includes("CARREGADOR")) return "Carregadores";
  if (text.includes("CABO")) return "Cabos";
  if (text.includes("FONE")) return "Fones de ouvido";
  return "Celulares";
}

const workbook = XLSX.read(await fs.readFile(sourcePath), {
  type: "buffer",
  cellDates: true,
});
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });

const rows = sourceRows
  .filter((row) => row.EMPRESA && row.TIPO)
  .map((row) => {
    const type = String(row.TIPO).trim().toLowerCase();
    const product = String(row.PROD ?? "").trim();
    const code = String(row.COD ?? "").trim();
    return {
      store: String(row.EMPRESA).trim(),
      date: dateFrom(row.DATA),
      order: String(row.PEDIDO ?? "").trim(),
      code,
      product,
      category: categoryFrom(product, code),
      type,
      quantity: numberFrom(row.QUANT),
      unitPrice: numberFrom(row.PRECO),
      total: numberFrom(row.TOTAL),
      cost: numberFrom(row.CUSTO),
      seller: String(row.VENDEDOR ?? "").trim(),
      payment: String(row["FORMA PAGAMENTO"] ?? "").trim() || "Não informado",
      priceType: String(row["TIPO PREÇO"] ?? "").trim(),
    };
  });

await fs.mkdir(new URL("../app/data/", import.meta.url), { recursive: true });
await fs.writeFile(
  outputPath,
  JSON.stringify(
    {
      sourceFile: sourcePath.split("\\").at(-1),
      uploadedAt: "2026-07-28T17:02:00-03:00",
      rows,
    },
    null,
    2,
  ),
);
