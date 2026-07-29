"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import initialSales from "./data/initial-sales.json";
import initialStock from "./data/initial-stock.json";
import type { SaleRow } from "../lib/sales";
import { isPhoneProduct, phoneModelName, type StockRow } from "../lib/stock";

type Dataset = {
  sourceFile: string;
  uploadedAt: string;
  rows: SaleRow[];
};

type StockDataset = {
  sourceFiles: string[];
  uploadedAt: string;
  rows: StockRow[];
};

type DailyPoint = {
  date: string;
  label: string;
  total: number;
  stores: Record<string, number>;
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

function signFor(row: SaleRow) {
  return row.type.includes("devol") ? -1 : 1;
}

function addMetric<K extends string>(
  map: Map<K, { revenue: number; units: number; profit: number }>,
  key: K,
  row: SaleRow,
) {
  const current = map.get(key) ?? { revenue: 0, units: 0, profit: 0 };
  const sign = signFor(row);
  current.revenue += sign * row.total;
  current.units += sign * row.quantity;
  current.profit += sign * (row.total - row.cost);
  map.set(key, current);
}

function analyzeRows(rows: SaleRow[]) {
  const categories = new Map<
    string,
    { revenue: number; units: number; profit: number }
  >();
  const stores = new Map<
    string,
    { revenue: number; units: number; profit: number }
  >();
  const phones = new Map<
    string,
    { revenue: number; units: number; profit: number }
  >();

  let revenue = 0;
  let cost = 0;
  let units = 0;
  let returns = 0;
  const ly115 = { revenue: 0, cost: 0, units: 0, profit: 0 };
  const paymentFilled = rows.filter(
    (row) => row.payment && row.payment !== "Não informado",
  ).length;

  for (const row of rows) {
    const sign = signFor(row);
    revenue += sign * row.total;
    cost += sign * row.cost;
    units += sign * row.quantity;
    if (sign < 0) returns += row.total;
    if (`${row.code} ${row.product}`.toUpperCase().includes("LY-115")) {
      ly115.revenue += sign * row.total;
      ly115.cost += sign * row.cost;
      ly115.units += sign * row.quantity;
      ly115.profit += sign * (row.total - row.cost);
    }
    addMetric(categories, row.category, row);
    addMetric(stores, row.store, row);
    if (row.category === "Celulares") {
      addMetric(phones, phoneModelName(row.product), row);
    }
  }

  const categoryList = [...categories.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.revenue - a.revenue);
  const storeList = [...stores.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.revenue - a.revenue);
  const phoneList = [...phones.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.revenue - a.revenue);

  const minDate = rows.reduce(
    (value, row) => (!value || row.date < value ? row.date : value),
    "",
  );
  const maxDate = rows.reduce(
    (value, row) => (!value || row.date > value ? row.date : value),
    "",
  );
  const storeNames = storeList.slice(0, 2).map((store) => store.name);
  const dailyMap = new Map<string, DailyPoint>();

  if (minDate && maxDate) {
    const cursor = new Date(`${minDate}T12:00:00Z`);
    const end = new Date(`${maxDate}T12:00:00Z`);
    while (cursor <= end) {
      const date = cursor.toISOString().slice(0, 10);
      dailyMap.set(date, {
        date,
        label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
        total: 0,
        stores: Object.fromEntries(storeNames.map((name) => [name, 0])),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  for (const row of rows) {
    const point = dailyMap.get(row.date);
    if (!point) continue;
    const amount = signFor(row) * row.total;
    point.total += amount;
    point.stores[row.store] = (point.stores[row.store] ?? 0) + amount;
  }

  return {
    revenue,
    profit: revenue - cost,
    margin: revenue ? (revenue - cost) / revenue : 0,
    units,
    returns,
    categories: categoryList,
    stores: storeList,
    phones: phoneList,
    daily: [...dailyMap.values()],
    storeNames,
    paymentFilled,
    ly115,
    minDate,
    maxDate,
  };
}

function stockKey(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function analyzeStock(rows: StockRow[], salesRows: SaleRow[]) {
  const variants = new Map<
    string,
    {
      code: string;
      description: string;
      light: number;
      boaVista: number;
      total: number;
      cost: number;
    }
  >();
  for (const row of rows) {
    if (!isPhoneProduct(row.product)) continue;
    const key = stockKey(row.code);
    const current = variants.get(key) ?? {
      code: row.code.trim(),
      description: row.product.trim(),
      light: 0,
      boaVista: 0,
      total: 0,
      cost: 0,
    };
    if (row.product.trim().length > current.description.length) {
      current.description = row.product.trim();
    }
    if (row.store.includes("SHOPPING LIGHT")) current.light += row.quantity;
    if (row.store.includes("BOA VISTA")) current.boaVista += row.quantity;
    current.total += row.quantity;
    current.cost += row.cost;
    variants.set(key, current);
  }

  const soldByVariant = new Map<
    string,
    { code: string; description: string; sold: number }
  >();
  for (const row of salesRows) {
    if (!isPhoneProduct(row.product)) continue;
    const key = stockKey(row.code);
    const current = soldByVariant.get(key) ?? {
      code: row.code.trim(),
      description: row.product.trim(),
      sold: 0,
    };
    if (row.product.trim().length > current.description.length) {
      current.description = row.product.trim();
    }
    current.sold += signFor(row) * row.quantity;
    soldByVariant.set(key, current);
  }

  const allVariants = new Set([...variants.keys(), ...soldByVariant.keys()]);
  const comparison = [...allVariants]
    .map((key) => {
      const stock = variants.get(key) ?? {
        code: "",
        description: "",
        light: 0,
        boaVista: 0,
        total: 0,
        cost: 0,
      };
      const sale = soldByVariant.get(key);
      const sold = sale?.sold ?? 0;
      const coverage = sold > 0 ? stock.total / sold : null;
      let status = "Sem venda";
      if (sold > 0 && stock.total === 0) status = "Sem estoque";
      else if (sold > 0 && stock.total < sold) status = "Crítico";
      else if (sold > 0 && stock.total < sold * 2) status = "Atenção";
      else if (sold > 0) status = "Coberto";
      return {
        code: stock.code || sale?.code || "",
        description: stock.description || sale?.description || "",
        sold,
        coverage,
        status,
        light: stock.light,
        boaVista: stock.boaVista,
        total: stock.total,
        cost: stock.cost,
      };
    })
    .sort(
      (a, b) =>
        b.sold - a.sold ||
        b.total - a.total ||
        a.description.localeCompare(b.description),
    );

  return {
    comparison,
    total: comparison.reduce((sum, item) => sum + item.total, 0),
    light: comparison.reduce((sum, item) => sum + item.light, 0),
    boaVista: comparison.reduce((sum, item) => sum + item.boaVista, 0),
    riskModels: comparison.filter(
      (item) => item.status === "Sem estoque" || item.status === "Crítico",
    ).length,
  };
}

function shortStore(name: string) {
  return name.replace(/^PANDA\s+/i, "").replace("SHOPPING LIGHT", "Shopping Light");
}

function formatDateRange(minDate: string, maxDate: string) {
  if (!minDate || !maxDate) return "Período não informado";
  return `${minDate.slice(8, 10)}–${maxDate.slice(8, 10)} ${new Date(
    `${maxDate}T12:00:00Z`,
  ).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" })}`;
}

function DailySalesChart({
  points,
  storeNames,
}: {
  points: DailyPoint[];
  storeNames: string[];
}) {
  const width = 920;
  const height = 280;
  const pad = { left: 62, right: 24, top: 20, bottom: 42 };
  const values = points.flatMap((point) => [
    point.total,
    ...storeNames.map((store) => point.stores[store] ?? 0),
  ]);
  const max = Math.max(...values, 1);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const barWidth = Math.min(12, (plotWidth / Math.max(points.length, 1)) * 0.28);
  const barGap = 2;
  const barGroupWidth =
    storeNames.length * barWidth + Math.max(storeNames.length - 1, 0) * barGap;
  const x = (index: number) =>
    pad.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => pad.top + plotHeight - (value / max) * plotHeight;
  const storeSeries = storeNames.map((store, index) => ({
    name: shortStore(store),
    className: index === 0 ? "series-store-a" : "series-store-b",
    values: points.map((p) => p.stores[store] ?? 0),
  }));
  const totalValues = points.map((point) => point.total);
  const tickIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  return (
    <div className="daily-chart-wrap">
      <div className="chart-legend" aria-label="Legenda do gráfico">
        <span>
          <i className="series-total" aria-hidden="true" />
          Total
        </span>
        {storeSeries.map((store) => (
          <span key={store.name}>
            <i className={store.className} aria-hidden="true" />
            {store.name}
          </span>
        ))}
      </div>
      <svg
        className="daily-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="daily-title daily-desc"
      >
        <title id="daily-title">Venda líquida diária total e por loja</title>
        <desc id="daily-desc">
          Colunas agrupadas mostram a receita líquida de cada loja e a linha mostra
          o total consolidado de cada dia.
        </desc>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = max * ratio;
          const py = y(value);
          return (
            <g key={ratio}>
              <line className="chart-grid" x1={pad.left} x2={width - pad.right} y1={py} y2={py} />
              <text className="chart-axis-label" x={pad.left - 12} y={py + 4} textAnchor="end">
                {value >= 1000 ? `${(value / 1000).toFixed(0)} mil` : value.toFixed(0)}
              </text>
            </g>
          );
        })}
        {points.map((point, pointIndex) => (
          <g key={point.date}>
            {storeSeries.map((store, storeIndex) => {
              const value = Math.max(store.values[pointIndex] ?? 0, 0);
              const barX =
                x(pointIndex) - barGroupWidth / 2 + storeIndex * (barWidth + barGap);
              return (
                <rect
                  className={`chart-bar ${store.className}`}
                  x={barX}
                  y={y(value)}
                  width={barWidth}
                  height={Math.max(y(0) - y(value), 0)}
                  rx="2"
                  key={store.name}
                >
                  <title>{`${point.label}: ${store.name} — ${money.format(value)}`}</title>
                </rect>
              );
            })}
          </g>
        ))}
        <g className="series-total">
          <polyline
            className="chart-line"
            points={totalValues.map((value, index) => `${x(index)},${y(value)}`).join(" ")}
          />
          {totalValues.map((value, index) => (
            <circle className="chart-point" cx={x(index)} cy={y(value)} r="3.4" key={points[index]?.date}>
              <title>{`${points[index]?.label}: Total — ${money.format(value)}`}</title>
            </circle>
          ))}
        </g>
        {tickIndexes.map((index) => (
          <text
            className="chart-axis-label"
            x={x(index)}
            y={height - 14}
            textAnchor="middle"
            key={index}
          >
            {points[index]?.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function Home() {
  const [dataset, setDataset] = useState<Dataset>(initialSales as Dataset);
  const [stockDataset, setStockDataset] = useState<StockDataset>(
    initialStock as StockDataset,
  );
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [stockUploadState, setStockUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [stockMessage, setStockMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const stockInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        if (payload.rows?.length) setDataset(payload as Dataset);
        if (payload.stockRows?.length) {
          setStockDataset({
            sourceFiles: payload.stockSourceFiles,
            uploadedAt: payload.stockUploadedAt,
            rows: payload.stockRows,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const analysis = useMemo(() => analyzeRows(dataset.rows), [dataset.rows]);
  const stockAnalysis = useMemo(
    () => analyzeStock(stockDataset.rows, dataset.rows),
    [stockDataset.rows, dataset.rows],
  );
  const storeMax = Math.max(...analysis.stores.map((item) => item.revenue), 1);
  const phoneMax = Math.max(...analysis.phones.map((item) => item.revenue), 1);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadState("uploading");
    setMessage(`Processando ${file.name}…`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao importar a planilha.");
      setDataset(payload as Dataset);
      setUploadState("success");
      setMessage(`${file.name} atualizada com ${payload.rows.length} registros.`);
    } catch (error) {
      setUploadState("error");
      setMessage(
        error instanceof Error ? error.message : "Não foi possível importar a planilha.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function onStockFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (!files.length) return;
    setStockUploadState("uploading");
    setStockMessage("Processando os estoques das duas lojas…");
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const response = await fetch("/api/stock", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Falha ao importar os estoques.");
      setStockDataset(payload as StockDataset);
      setStockUploadState("success");
      setStockMessage(
        `Estoques atualizados: ${integer.format(
          payload.rows.reduce(
            (sum: number, row: StockRow) => sum + row.quantity,
            0,
          ),
        )} celulares.`,
      );
    } catch (error) {
      setStockUploadState("error");
      setStockMessage(
        error instanceof Error ? error.message : "Não foi possível importar os estoques.",
      );
    } finally {
      event.target.value = "";
    }
  }

  const updatedAt = new Date(dataset.uploadedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const stockUpdatedAt = new Date(stockDataset.uploadedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>Varejo Analytics</span>
        </div>
        <div className="topbar-actions">
          <span className="updated">Atualizado em {updatedAt}</span>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileChange}
            aria-label="Selecionar planilha de vendas"
          />
          <button
            className="upload-button"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadState === "uploading"}
          >
            <span aria-hidden="true">↥</span>
            {uploadState === "uploading" ? "Processando…" : "Atualizar planilha"}
          </button>
        </div>
      </header>

      <div className="page-shell">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Performance comercial</p>
            <h1>Visão de Vendas</h1>
            <p>{formatDateRange(analysis.minDate, analysis.maxDate)} · Todas as lojas</p>
          </div>
          <div className={`data-status ${uploadState}`}>
            <span aria-hidden="true" />
            {uploadState === "error" ? "Importação pendente" : "Base processada"}
          </div>
        </section>

        {message && (
          <div className={`upload-message ${uploadState}`} role="status">
            {message}
          </div>
        )}

        <section className="kpi-strip" aria-label="Indicadores principais">
          {[
            ["Receita líquida", money.format(analysis.revenue), "Receita após devoluções"],
            ["Lucro bruto", money.format(analysis.profit), "Resultado bruto do período"],
            ["Margem", percent.format(analysis.margin), "Sobre a receita líquida"],
            ["Itens líquidos", integer.format(analysis.units), "Unidades após devoluções"],
          ].map(([label, value, note], index) => (
            <article className={index === 0 ? "kpi-card active" : "kpi-card"} key={label}>
              <p>{label}</p>
              <strong>{value}</strong>
              <span>{note}</span>
            </article>
          ))}
        </section>

        <section className="overview-grid">
          <article className="panel category-panel">
            <div className="panel-header">
              <h2>Receita por categoria</h2>
              <span>Participação na receita líquida</span>
            </div>
            <div className="panel-body">
              <div className="panel-total">
                <strong>{money.format(analysis.revenue)}</strong>
                <span>100% do período</span>
              </div>
              <div className="stacked-bar" aria-label="Participação por categoria">
                {analysis.categories.map((category, index) => (
                  <span
                    className={`category-tone tone-${Math.min(index + 1, 5)}`}
                    style={{ width: `${Math.max((category.revenue / analysis.revenue) * 100, 0.45)}%` }}
                    key={category.name}
                    title={`${category.name}: ${money.format(category.revenue)}`}
                  />
                ))}
              </div>
              <div className="category-list">
                {analysis.categories.map((category, index) => (
                  <div key={category.name}>
                    <span className={`legend-dot tone-${Math.min(index + 1, 5)}`} />
                    <div>
                      <p>{category.name}</p>
                      <small>{percent.format(category.revenue / analysis.revenue)} da receita</small>
                    </div>
                    <strong>{money.format(category.revenue)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <div className="side-stack">
            <article className="panel store-panel">
              <div className="panel-header">
                <h2>Comparativo por loja</h2>
                <span>Receita líquida</span>
              </div>
              <div className="panel-body">
                {analysis.stores.map((store, index) => (
                  <div className="store-row" key={store.name}>
                    <div className="store-row-label">
                      <span>{shortStore(store.name)}</span>
                      <strong>{money.format(store.revenue)}</strong>
                    </div>
                    <div className="bar-track">
                      <span
                        className={index === 0 ? "bar-primary" : "bar-secondary"}
                        style={{ width: `${(store.revenue / storeMax) * 100}%` }}
                      />
                    </div>
                    <small>{integer.format(store.units)} itens líquidos</small>
                  </div>
                ))}
              </div>
            </article>

            {analysis.ly115.units > 0 && analysis.ly115.profit < 0 ? (
              <article className="attention-card">
                <span className="attention-icon" aria-hidden="true">!</span>
                <div>
                  <h2>Preço atípico no LY-115</h2>
                  <p>
                    {integer.format(analysis.ly115.units)} unidades somaram{" "}
                    {money.format(analysis.ly115.revenue)} em receita e impacto bruto de{" "}
                    {money.format(analysis.ly115.profit)}. Revise preço e custo antes do
                    próximo fechamento.
                  </p>
                </div>
              </article>
            ) : (
              <article className="attention-card resolved">
                <span className="attention-icon" aria-hidden="true">✓</span>
                <div>
                  <h2>Sem alertas críticos</h2>
                  <p>Nenhuma anomalia de preço monitorada foi encontrada nesta base.</p>
                </div>
              </article>
            )}

            <article className="payment-card">
              <div>
                <h2>Tipo de pagamento</h2>
                <p>Campo preenchido em {analysis.paymentFilled} de {dataset.rows.length} registros</p>
              </div>
              <strong>{analysis.paymentFilled ? "Parcial" : "Não informado"}</strong>
            </article>
          </div>
        </section>

        <section className="panel daily-panel">
          <div className="panel-header">
            <div>
              <h2>Venda diária total e por loja</h2>
              <p>Receita líquida diária, já descontadas as devoluções</p>
            </div>
            <span>{analysis.daily.length} dias</span>
          </div>
          <div className="panel-body">
            <DailySalesChart points={analysis.daily} storeNames={analysis.storeNames} />
          </div>
        </section>

        <section className="panel ranking-panel">
          <div className="panel-header">
            <div>
              <h2>Ranking de vendas de celulares</h2>
              <p>Modelos identificados automaticamente pelo nome do produto</p>
            </div>
            <span>Ordenado por receita líquida</span>
          </div>
          <div className="ranking-table" role="table" aria-label="Ranking de modelos de celulares">
            <div className="ranking-head" role="row">
              <span>#</span>
              <span>Modelo</span>
              <span>Participação</span>
              <span>Itens</span>
              <span>Receita líquida</span>
              <span>Margem %</span>
            </div>
            {analysis.phones.map((phone, index) => (
              <div className="ranking-row" role="row" key={phone.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{phone.name}</strong>
                <div className="microbar">
                  <span style={{ width: `${(phone.revenue / phoneMax) * 100}%` }} />
                </div>
                <span>{integer.format(phone.units)}</span>
                <strong>{money.format(phone.revenue)}</strong>
                <strong
                  className={
                    phone.profit < 0 ? "ranking-margin negative" : "ranking-margin"
                  }
                >
                  {phone.revenue ? percent.format(phone.profit / phone.revenue) : "—"}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stock-panel">
          <div className="panel-header stock-header">
            <div>
              <h2>Estoque de celulares × vendas</h2>
              <p>
                Estoque atual por loja comparado às vendas de cada versão/SKU
              </p>
            </div>
            <div className="stock-actions">
              <span>Estoque de {stockUpdatedAt}</span>
              <input
                ref={stockInputRef}
                className="sr-only"
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={onStockFileChange}
                aria-label="Selecionar estoques do Shopping Light e Boa Vista"
              />
              <button
                className="secondary-button"
                type="button"
                onClick={() => stockInputRef.current?.click()}
                disabled={stockUploadState === "uploading"}
              >
                <span aria-hidden="true">↥</span>
                {stockUploadState === "uploading"
                  ? "Processando…"
                  : "Atualizar estoques"}
              </button>
            </div>
          </div>

          {stockMessage && (
            <div className={`stock-message ${stockUploadState}`} role="status">
              {stockMessage}
            </div>
          )}

          <div className="stock-summary" aria-label="Resumo do estoque de celulares">
            <div>
              <span>Estoque total</span>
              <strong>{integer.format(stockAnalysis.total)}</strong>
              <small>celulares</small>
            </div>
            <div>
              <span>Shopping Light</span>
              <strong>{integer.format(stockAnalysis.light)}</strong>
              <small>celulares</small>
            </div>
            <div>
              <span>Boa Vista</span>
              <strong>{integer.format(stockAnalysis.boaVista)}</strong>
              <small>celulares</small>
            </div>
            <div className={stockAnalysis.riskModels ? "summary-risk" : ""}>
              <span>Versões críticas</span>
              <strong>{integer.format(stockAnalysis.riskModels)}</strong>
              <small>sem estoque ou abaixo das vendas</small>
            </div>
          </div>

          <div
            className="stock-table"
            role="table"
            aria-label="Estoque e vendas por versão de celular"
          >
            <div className="stock-table-head" role="row">
              <span>Descrição completa</span>
              <span>Vendidos</span>
              <span>Light</span>
              <span>Boa Vista</span>
              <span>Estoque</span>
              <span>Estoque ÷ venda</span>
              <span>Situação</span>
            </div>
            {stockAnalysis.comparison.map((item) => (
              <div
                className="stock-table-row"
                role="row"
                key={`${item.code}-${item.description}`}
              >
                <div className="stock-product">
                  <strong>{item.description}</strong>
                  <small>{item.code}</small>
                </div>
                <span>{integer.format(item.sold)}</span>
                <span>{integer.format(item.light)}</span>
                <span>{integer.format(item.boaVista)}</span>
                <strong>{integer.format(item.total)}</strong>
                <span>
                  {item.coverage === null
                    ? "—"
                    : `${item.coverage.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}×`}
                </span>
                <span
                  className={`stock-status status-${item.status
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, "-")
                    .toLowerCase()}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <div className="stock-source">
            Fontes: {stockDataset.sourceFiles.join(" · ")}
          </div>
        </section>

        <footer>
          <span>Fonte atual: {dataset.sourceFile}</span>
          <span>{dataset.rows.length} registros processados</span>
        </footer>
      </div>
    </main>
  );
}
