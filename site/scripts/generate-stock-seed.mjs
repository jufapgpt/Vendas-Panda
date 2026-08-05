import fs from "node:fs/promises";
import * as XLSX from "xlsx";

const sources = [
  {
    path: "C:/Users/marce/Downloads/Light.xlsx",
    store: "PANDA SHOPPING LIGHT",
  },
  {
    path: "C:/Users/marce/Downloads/Boa vista.xlsx",
    store: "PANDA BOA VISTA",
  },
];

function numberFrom(value) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

const rows = [];
for (const source of sources) {
  const workbook = XLSX.read(await fs.readFile(source.path), { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  for (const record of records) {
    const product = String(record.PROD ?? "").trim();
    const row = {
      store: source.store,
      code: String(record["CÓD"] ?? record.COD ?? "").trim(),
      product,
      quantity: numberFrom(record["QUANT."] ?? record.QUANT),
      cost: numberFrom(record["TOTAL CUSTO"]),
    };
    if (row.code && product && row.quantity > 0) rows.push(row);
  }
}

await fs.writeFile(
  new URL("../app/data/initial-stock.json", import.meta.url),
  `${JSON.stringify({
    sourceFiles: sources.map((source) => source.path.split("/").at(-1)),
    uploadedAt: new Date().toISOString(),
    rows,
  }, null, 2)}\n`,
);

console.log(`Generated ${rows.length} stock rows.`);
