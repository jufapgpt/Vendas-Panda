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
import { DriveSyncStatus } from "./drive-sync-status";
import type { SaleRow } from "../lib/sales";
import { formatBrasiliaDateTime } from "../lib/date-time";
import {
  CATEGORY_COLORS,
  PRODUCT_CATEGORIES,
  classifyProduct,
  inferProductCategory,
  type ProductCategory,
} from "../lib/categories";
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

type StoreFilter = "all" | "light" | "boa-vista";
type DateFilter = "month" | "previous-month" | "today" | "yesterday" | "custom";
type StockCategoryFilter = ProductCategory | "uncategorized";

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
const percentTwo = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function signFor(row: SaleRow) {
  return row.type.includes("devol") ? -1 : 1;
}

function netQuantity(row: SaleRow) {
  return signFor(row) * Math.abs(row.quantity);
}

function matchesStore(store: string, filter: StoreFilter) {
  if (filter === "all") return true;
  const normalized = store.toUpperCase();
  return filter === "light"
    ? normalized.includes("SHOPPING LIGHT")
    : normalized.includes("BOA VISTA");
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previousDate(date: string) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() - 1);
  return localDateISO(value);
}

function previousMonthRange(date: string) {
  const currentYear = Number(date.slice(0, 4));
  const currentMonth = Number(date.slice(5, 7));
  const month = currentMonth === 1 ? 12 : currentMonth - 1;
  const year = currentMonth === 1 ? currentYear - 1 : currentYear;
  const monthText = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}

function selectedDateLabel(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return new Date(`${startDate}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return formatDateRange(startDate, endDate);
}

function inventoryStatus(stock: number, sold: number) {
  if (sold <= 0) return "Sem venda";
  if (stock === 0) return "Sem estoque";
  if (stock < sold) return "Crítico";
  if (stock < sold * 2) return "Atenção";
  return "Coberto";
}

function addMetric<K extends string>(
  map: Map<K, { revenue: number; units: number; profit: number }>,
  key: K,
  row: SaleRow,
) {
  const current = map.get(key) ?? { revenue: 0, units: 0, profit: 0 };
  const sign = signFor(row);
  current.revenue += sign * row.total;
  current.units += netQuantity(row);
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
  const sellers = new Map<
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
    units += netQuantity(row);
    if (sign < 0) returns += row.total;
    if (`${row.code} ${row.product}`.toUpperCase().includes("LY-115")) {
      ly115.revenue += sign * row.total;
      ly115.cost += sign * row.cost;
      ly115.units += netQuantity(row);
      ly115.profit += sign * (row.total - row.cost);
    }
    const category = inferProductCategory(row.product, row.code);
    addMetric(categories, category, row);
    addMetric(stores, row.store, row);
    addMetric(sellers, row.seller || "Não informado", row);
    if (category === "Celulares") {
      addMetric(phones, phoneModelName(row.product), row);
    }
  }

  const categoryList = PRODUCT_CATEGORIES.map((name) => ({
    name,
    ...(categories.get(name) ?? { revenue: 0, units: 0, profit: 0 }),
  }))
    .sort((a, b) => b.revenue - a.revenue);
  const storeList = [...stores.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.revenue - a.revenue);
  const sellerList = [...sellers.entries()]
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
    sellers: sellerList,
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
    { code: string; description: string; sold: number; revenue: number }
  >();
  for (const row of salesRows) {
    const key = stockKey(row.code);
    const current = soldByVariant.get(key) ?? {
      code: row.code.trim(),
      description: row.product.trim(),
      sold: 0,
      revenue: 0,
    };
    if (row.product.trim().length > current.description.length) {
      current.description = row.product.trim();
    }
    current.sold += netQuantity(row);
    current.revenue += signFor(row) * row.total;
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
      const averageCost = stock.total > 0 ? stock.cost / stock.total : null;
      const averageSale = sold > 0 ? (sale?.revenue ?? 0) / sold : null;
      const status = inventoryStatus(stock.total, sold);
      return {
        code: stock.code || sale?.code || "",
        description: stock.description || sale?.description || "",
        sold,
        coverage,
        averageCost,
        averageSale,
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

function compactChartValue(value: number) {
  if (Math.abs(value) < 1000) return integer.format(value);
  const abbreviated = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 1000);
  return `${abbreviated}K`;
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
                {compactChartValue(value)}
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

type CategorySlice = {
  name: ProductCategory;
  value: number;
  units?: number;
  profit?: number;
  cost?: number;
};

function CategoryPie({
  data,
  formatValue,
  totalLabel,
}: {
  data: CategorySlice[];
  formatValue: (value: number) => string;
  totalLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  const hasSalesMetrics = data.some(
    (item) => item.units !== undefined && item.profit !== undefined,
  );
  const hasStockCost = data.some((item) => item.cost !== undefined);
  const totalCost = data.reduce((sum, item) => sum + (item.cost ?? 0), 0);
  let cursor = 0;
  const segments = data.map((item) => {
    const start = cursor;
    cursor += total ? (Math.max(item.value, 0) / total) * 100 : 0;
    return `${CATEGORY_COLORS[item.name]} ${start}% ${cursor}%`;
  });
  const background = total
    ? `conic-gradient(${segments.join(", ")})`
    : "#eef1f5";

  return (
    <div className="category-pie-body">
      <div
        className="category-pie"
        style={{ background }}
        role="img"
        aria-label={data
          .map(
            (item) =>
              `${item.name}: ${formatValue(item.value)}, ${
                total ? percent.format(item.value / total) : "0%"
              }`,
          )
          .join(". ")}
      >
        <div>
          <strong>{formatValue(total)}</strong>
          <span>{totalLabel}</span>
        </div>
      </div>
      <div
        className={`category-pie-legend${
          hasSalesMetrics || hasStockCost ? " with-details" : ""
        }`}
      >
        {data.map((item) => {
          const itemMargin = item.value ? (item.profit ?? 0) / item.value : 0;

          return (
            <div className="category-pie-legend-row" key={item.name}>
              <div className="category-pie-legend-main">
                <i
                  style={{ background: CATEGORY_COLORS[item.name] }}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
                <strong>{formatValue(item.value)}</strong>
                <small>{total ? percent.format(item.value / total) : "0%"}</small>
              </div>
              {item.units !== undefined && item.profit !== undefined ? (
                <div className="category-pie-legend-details">
                  <span>
                    <b>{integer.format(item.units)}</b> vendidos
                  </span>
                  <span>
                    Margem <b>{money.format(item.profit)}</b>
                  </span>
                  <span>
                    <b>{percentTwo.format(itemMargin)}</b>
                  </span>
                </div>
              ) : item.cost !== undefined ? (
                <div className="category-pie-legend-details stock-cost-detail">
                  <span>
                    Custo <b>{money.format(item.cost)}</b>
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
        {hasStockCost ? (
          <div className="category-pie-total-cost">
            <span>Custo total do estoque</span>
            <strong>{money.format(totalCost)}</strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Home() {
  const [dataset, setDataset] = useState<Dataset>(initialSales as Dataset);
  const [stockDataset, setStockDataset] = useState<StockDataset>(
    initialStock as StockDataset,
  );
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("all");
  const [today] = useState(() => localDateISO());
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStart, setCustomStart] = useState(() => {
    const current = localDateISO();
    return `${current.slice(0, 7)}-01`;
  });
  const [customEnd, setCustomEnd] = useState(() => localDateISO());
  const [stockSearch, setStockSearch] = useState("");
  const [stockCategory, setStockCategory] =
    useState<StockCategoryFilter>("Celulares");
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        if (payload.rows?.length) setDataset(payload as Dataset);
        if (
          payload.stockRows?.length &&
          payload.stockRows.some((row: StockRow) => !isPhoneProduct(row.product))
        ) {
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

  const activeDateRange = useMemo(() => {
    if (dateFilter === "today") return { start: today, end: today };
    if (dateFilter === "yesterday") {
      const yesterday = previousDate(today);
      return { start: yesterday, end: yesterday };
    }
    if (dateFilter === "previous-month") return previousMonthRange(today);
    if (dateFilter === "custom") {
      return customStart <= customEnd
        ? { start: customStart, end: customEnd }
        : { start: customEnd, end: customStart };
    }
    return { start: `${today.slice(0, 7)}-01`, end: today };
  }, [customEnd, customStart, dateFilter, today]);
  const filteredSalesRows = useMemo(
    () =>
      dataset.rows.filter(
        (row) =>
          matchesStore(row.store, storeFilter) &&
          row.date >= activeDateRange.start &&
          row.date <= activeDateRange.end,
      ),
    [activeDateRange, dataset.rows, storeFilter],
  );
  const filteredStockRows = useMemo(
    () => stockDataset.rows.filter((row) => matchesStore(row.store, storeFilter)),
    [stockDataset.rows, storeFilter],
  );
  const analysis = useMemo(() => analyzeRows(filteredSalesRows), [filteredSalesRows]);
  const stockCategories = useMemo(
    () =>
      PRODUCT_CATEGORIES.map((name) => {
        const totals = filteredStockRows.reduce(
          (current, row) => {
            if (classifyProduct(row.product, row.code).category === name) {
              current.value += row.quantity;
              current.cost += row.cost;
            }
            return current;
          },
          { value: 0, cost: 0 },
        );
        return { name, ...totals };
      }),
    [filteredStockRows],
  );
  const unknownStockProducts = useMemo(() => {
    const products = new Map<string, StockRow>();
    for (const row of stockDataset.rows) {
      if (classifyProduct(row.product, row.code).recognized) continue;
      products.set(stockKey(row.code) || normalizeSearch(row.product), row);
    }
    return [...products.values()].sort((a, b) =>
      a.product.localeCompare(b.product),
    );
  }, [stockDataset.rows]);
  const categoryStockRows = useMemo(
    () =>
      filteredStockRows.filter((row) => {
        const classification = classifyProduct(row.product, row.code);
        return stockCategory === "uncategorized"
          ? !classification.recognized
          : classification.category === stockCategory;
      }),
    [filteredStockRows, stockCategory],
  );
  const categorySalesRows = useMemo(
    () =>
      filteredSalesRows.filter((row) => {
        const classification = classifyProduct(row.product, row.code);
        return stockCategory === "uncategorized"
          ? !classification.recognized
          : classification.category === stockCategory;
      }),
    [filteredSalesRows, stockCategory],
  );
  const stockAnalysis = useMemo(
    () => analyzeStock(categoryStockRows, categorySalesRows),
    [categoryStockRows, categorySalesRows],
  );
  const phoneStockByModel = useMemo(() => {
    const stockByModel = new Map<string, number>();
    for (const row of filteredStockRows) {
      if (!isPhoneProduct(row.product)) continue;
      const model = phoneModelName(row.product);
      stockByModel.set(model, (stockByModel.get(model) ?? 0) + row.quantity);
    }
    return stockByModel;
  }, [filteredStockRows]);
  const visibleStockItems = useMemo(() => {
    const query = normalizeSearch(stockSearch);
    if (!query) return stockAnalysis.comparison;
    return stockAnalysis.comparison.filter((item) =>
      normalizeSearch(`${item.description} ${item.code}`).includes(query),
    );
  }, [stockAnalysis.comparison, stockSearch]);
  const visibleStockSummary = useMemo(
    () => ({
      total: visibleStockItems.reduce((sum, item) => sum + item.total, 0),
      light: visibleStockItems.reduce((sum, item) => sum + item.light, 0),
      boaVista: visibleStockItems.reduce((sum, item) => sum + item.boaVista, 0),
      riskModels: visibleStockItems.filter(
        (item) => item.status === "Sem estoque" || item.status === "Crítico",
      ).length,
    }),
    [visibleStockItems],
  );
  const storeMax = Math.max(...analysis.stores.map((item) => item.revenue), 1);
  const sellerMax = Math.max(...analysis.sellers.map((item) => item.revenue), 1);
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
      setDateFilter("month");
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

  const updatedAt = formatBrasiliaDateTime(dataset.uploadedAt);
  const stockUpdatedAt = formatBrasiliaDateTime(stockDataset.uploadedAt);

  return (
    <main>
      <header className="topbar">
        <div className="topbar-main">
          <div className="brand">
            <span className="brand-logo-frame">
              <img className="brand-logo" src="/logo-panda.png" alt="Panda" />
            </span>
            <span>Varejo Analytics</span>
          </div>
          <nav className="report-tabs" aria-label="Relatórios">
            <a className="active" aria-current="page" href="/">Visão geral</a>
            <a href="/vendedores">Vendedores</a>
            <a href="/analise-diaria">Análise diária</a>
            <a href="/estoque">Análise de estoque</a>
            <a href="/dre">Dados DRE</a>
          </nav>
        </div>
        <DriveSyncStatus updatedAt={updatedAt} allowManualSync />
      </header>

      <div className="page-shell">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Performance comercial</p>
            <h1>Visão de Vendas</h1>
            <p>
              {selectedDateLabel(activeDateRange.start, activeDateRange.end)} ·{" "}
              {storeFilter === "all"
                ? "Todas as lojas"
                : storeFilter === "light"
                  ? "Shopping Light"
                  : "Boa Vista"}
            </p>
          </div>
          <div className="heading-controls">
            <div className="store-filter" role="group" aria-label="Filtrar por loja">
              {[
                ["all", "Lojas"],
                ["light", "Light"],
                ["boa-vista", "Boavista"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  className={storeFilter === value ? "active" : ""}
                  aria-pressed={storeFilter === value}
                  onClick={() => setStoreFilter(value as StoreFilter)}
                  key={value}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="date-filter-wrap">
              <div className="date-filter" role="group" aria-label="Filtrar por período">
                {[
                  ["month", "Mês atual"],
                  ["previous-month", "Mês anterior"],
                  ["today", "Hoje"],
                  ["yesterday", "Ontem"],
                  ["custom", "Período"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    className={dateFilter === value ? "active" : ""}
                    aria-pressed={dateFilter === value}
                    onClick={() => setDateFilter(value as DateFilter)}
                    key={value}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dateFilter === "custom" && (
                <div className="date-range-inputs">
                  <label>
                    <span>Data inicial</span>
                    <input
                      type="date"
                      value={customStart}
                      max={customEnd}
                      required
                      onChange={(event) => {
                        if (event.target.value) setCustomStart(event.target.value);
                      }}
                    />
                  </label>
                  <i aria-hidden="true">até</i>
                  <label>
                    <span>Data final</span>
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart}
                      max={today}
                      required
                      onChange={(event) => {
                        if (event.target.value) setCustomEnd(event.target.value);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
            <div className={`data-status ${uploadState}`}>
              <span aria-hidden="true" />
              {uploadState === "error" ? "Importação pendente" : "Base processada"}
            </div>
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

        <section className="overview-grid compact-overview">
          <article className="panel category-panel">
            <div className="panel-header">
              <h2>Receita por categoria</h2>
              <span>Participação</span>
            </div>
            <div className="panel-body">
              <div className="panel-total">
                <strong>{money.format(analysis.revenue)}</strong>
                <span>100% do período</span>
              </div>
              <div className="stacked-bar" aria-label="Participação por categoria">
                {analysis.categories.map((category) => (
                  <span
                    className="category-tone"
                    style={{
                      background: CATEGORY_COLORS[category.name],
                      width: `${
                        analysis.revenue > 0 && category.revenue > 0
                          ? Math.max(
                              (category.revenue / analysis.revenue) * 100,
                              0.45,
                            )
                          : 0
                      }%`,
                    }}
                    key={category.name}
                    title={`${category.name}: ${money.format(category.revenue)}`}
                  />
                ))}
              </div>
              <div className="category-list">
                {analysis.categories.map((category) => (
                  <div key={category.name}>
                    <span
                      className="legend-dot"
                      style={{ background: CATEGORY_COLORS[category.name] }}
                    />
                    <div>
                      <p>{category.name}</p>
                      <small>
                        {analysis.revenue
                          ? percent.format(category.revenue / analysis.revenue)
                          : "0%"}{" "}
                        da receita
                      </small>
                    </div>
                    <strong>{money.format(category.revenue)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel seller-panel">
            <div className="panel-header">
              <h2>Vendas por vendedor</h2>
              <span>Receita líquida</span>
            </div>
            <div className="panel-body">
              {analysis.sellers.map((seller, index) => (
                <div className="seller-row" key={seller.name}>
                  <div className="seller-rank">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="seller-content">
                    <div className="seller-row-label">
                      <span title={seller.name}>{seller.name}</span>
                      <strong>{money.format(seller.revenue)}</strong>
                    </div>
                    <div className="microbar">
                      <span
                        style={{
                          width: `${Math.max(
                            (seller.revenue / sellerMax) * 100,
                            0,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="seller-row-details">
                      <small>{integer.format(seller.units)} itens</small>
                      <span>
                        Margem{" "}
                        {seller.revenue
                          ? percentTwo.format(seller.profit / seller.revenue)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {!analysis.sellers.length && (
                <p className="empty-panel">Sem vendas no período selecionado.</p>
              )}
            </div>
          </article>

          <article className="panel store-panel">
            <div className="panel-header">
              <h2>Comparativo por loja</h2>
              <span>Receita e margem</span>
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
                  <div className="store-row-details">
                    <small>{integer.format(store.units)} itens líquidos</small>
                    <span
                      className={
                        store.profit < 0 ? "store-margin negative" : "store-margin"
                      }
                    >
                      <strong>{money.format(store.profit)}</strong>
                      <b>
                        {store.revenue
                          ? percentTwo.format(store.profit / store.revenue)
                          : "—"}
                      </b>
                    </span>
                  </div>
                </div>
              ))}
              {!analysis.stores.length && (
                <p className="empty-panel">Sem vendas no período selecionado.</p>
              )}
            </div>
          </article>
        </section>

        <section className="insight-grid">
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
              <p>
                Campo preenchido em {analysis.paymentFilled} de{" "}
                {filteredSalesRows.length} registros
              </p>
            </div>
            <strong>{analysis.paymentFilled ? "Parcial" : "Não informado"}</strong>
          </article>
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
              <span>Estoque</span>
              <span>Situação</span>
            </div>
            {analysis.phones.map((phone, index) => {
              const stock = phoneStockByModel.get(phone.name) ?? 0;
              const status = inventoryStatus(stock, phone.units);
              return (
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
                  <span>{integer.format(stock)}</span>
                  <span
                    className={`stock-status status-${status
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel stock-panel">
          <div className="panel-header stock-header">
            <div>
              <h2>Estoque × vendas</h2>
              <p>
                Estoque atual por loja comparado às vendas de cada produto/SKU
              </p>
            </div>
            <div className="stock-actions">
              <span>Estoque de {stockUpdatedAt}</span>
              <span className="drive-sync-state">
                <span className="drive-sync-dot" aria-hidden="true" />
                Google Drive automático
              </span>
              {unknownStockProducts.length > 0 && (
                <button
                  className="stock-category-alert"
                  type="button"
                  onClick={() => {
                    setStockCategory("uncategorized");
                    setStockSearch("");
                  }}
                  aria-label={`${unknownStockProducts.length} produtos sem categoria. Exibir para revisão.`}
                >
                  <span aria-hidden="true">!</span>
                  {integer.format(unknownStockProducts.length)} sem categoria
                </button>
              )}
            </div>
          </div>

          <div className="stock-search-bar">
            <label htmlFor="stock-description-search">Filtrar descrição</label>
            <input
              id="stock-description-search"
              type="search"
              value={stockSearch}
              onChange={(event) => setStockSearch(event.target.value)}
              placeholder="Digite modelo, memória, cor ou código"
              autoComplete="off"
            />
            <div
              className="stock-category-filters"
              role="group"
              aria-label="Filtrar estoque por categoria"
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <button
                  type="button"
                  className={stockCategory === category ? "active" : ""}
                  aria-pressed={stockCategory === category}
                  onClick={() => setStockCategory(category)}
                  key={category}
                >
                  {category}
                </button>
              ))}
              {unknownStockProducts.length > 0 && (
                <button
                  type="button"
                  className={
                    stockCategory === "uncategorized" ? "warning active" : "warning"
                  }
                  aria-pressed={stockCategory === "uncategorized"}
                  onClick={() => setStockCategory("uncategorized")}
                >
                  Sem categoria
                </button>
              )}
            </div>
            <span aria-live="polite">
              {integer.format(visibleStockItems.length)}{" "}
              {visibleStockItems.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </span>
          </div>

          <div
            className={`stock-summary ${storeFilter === "all" ? "" : "filtered"}`}
            aria-label="Resumo do estoque da categoria selecionada"
          >
            <div>
              <span>Estoque total</span>
              <strong>{integer.format(visibleStockSummary.total)}</strong>
              <small>
                {stockCategory === "uncategorized"
                  ? "itens sem categoria"
                  : stockCategory.toLowerCase()}
              </small>
            </div>
            {(storeFilter === "all" || storeFilter === "light") && (
              <div>
                <span>Shopping Light</span>
                <strong>{integer.format(visibleStockSummary.light)}</strong>
                <small>itens em estoque</small>
              </div>
            )}
            {(storeFilter === "all" || storeFilter === "boa-vista") && (
              <div>
                <span>Boa Vista</span>
                <strong>{integer.format(visibleStockSummary.boaVista)}</strong>
                <small>itens em estoque</small>
              </div>
            )}
            <div className={visibleStockSummary.riskModels ? "summary-risk" : ""}>
              <span>Produtos críticos</span>
              <strong>{integer.format(visibleStockSummary.riskModels)}</strong>
              <small>sem estoque ou abaixo das vendas</small>
            </div>
          </div>

          <div
            className={`stock-table ${storeFilter === "all" ? "" : "single-store"}`}
            role="table"
            aria-label="Estoque e vendas por produto"
          >
            <div className="stock-table-head" role="row">
              <span>Descrição completa</span>
              <span>Vendidos</span>
              {storeFilter === "all" ? (
                <>
                  <span>Light</span>
                  <span>Boa Vista</span>
                </>
              ) : (
                <span>{storeFilter === "light" ? "Light" : "Boa Vista"}</span>
              )}
              <span>Estoque</span>
              <span>Custo médio</span>
              <span>Venda média</span>
              <span>Estoque ÷ venda</span>
              <span>Situação</span>
            </div>
            {visibleStockItems.map((item) => (
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
                {storeFilter === "all" ? (
                  <>
                    <span>{integer.format(item.light)}</span>
                    <span>{integer.format(item.boaVista)}</span>
                  </>
                ) : (
                  <span>
                    {integer.format(
                      storeFilter === "light" ? item.light : item.boaVista,
                    )}
                  </span>
                )}
                <strong>{integer.format(item.total)}</strong>
                <span>
                  {item.averageCost === null ? "—" : money.format(item.averageCost)}
                </span>
                <span>
                  {item.averageSale === null ? "—" : money.format(item.averageSale)}
                </span>
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
            {!visibleStockItems.length && (
              <div className="stock-empty" role="status">
                Nenhum produto encontrado
                {stockSearch ? ` para “${stockSearch}”` : ""} nesta categoria.
              </div>
            )}
          </div>
          <div className="stock-source">
            Fontes: {stockDataset.sourceFiles.join(" · ")}
          </div>
        </section>

        <section className="category-pies-grid" aria-label="Vendas e estoque por categoria">
          <article className="panel category-pie-panel">
            <div className="panel-header">
              <div>
                <h2>Vendas por categoria</h2>
                <p>Participação na receita líquida do período</p>
              </div>
              <span>{storeFilter === "all" ? "Todas as lojas" : "Loja selecionada"}</span>
            </div>
            <CategoryPie
              data={analysis.categories.map((item) => ({
                name: item.name,
                value: item.revenue,
                units: item.units,
                profit: item.profit,
              }))}
              formatValue={(value) => money.format(value)}
              totalLabel="receita líquida"
            />
          </article>

          <article className="panel category-pie-panel">
            <div className="panel-header">
              <div>
                <h2>Estoque por categoria</h2>
                <p>Participação nas unidades disponíveis</p>
              </div>
              <span>{storeFilter === "all" ? "Todas as lojas" : "Loja selecionada"}</span>
            </div>
            <CategoryPie
              data={stockCategories}
              formatValue={(value) => integer.format(value)}
              totalLabel="itens em estoque"
            />
          </article>
        </section>

        <footer>
          <span>Fonte atual: {dataset.sourceFile}</span>
          <span>{filteredSalesRows.length} registros na visão selecionada</span>
        </footer>
      </div>
    </main>
  );
}
