"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import initialSales from "../data/initial-sales.json";
import { DriveSyncStatus } from "../drive-sync-status";
import type { SaleRow } from "../../lib/sales";
import { formatBrasiliaDateTime } from "../../lib/date-time";
import {
  CATEGORY_COLORS,
  PRODUCT_CATEGORIES,
  inferProductCategory,
  type ProductCategory,
} from "../../lib/categories";

type Dataset = {
  sourceFile: string;
  uploadedAt: string;
  rows: SaleRow[];
};

type StoreFilter = "all" | "light" | "boa-vista";
type DateFilter = "month" | "previous-month" | "today" | "yesterday" | "custom";

type DreRow = {
  store: string;
  category: ProductCategory;
  cost: number;
  netCost: number;
  revenue: number;
  netRevenue: number;
  pisCofins: number;
  icms: number;
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function signFor(row: SaleRow) {
  return row.type.includes("devol") ? -1 : 1;
}

function matchesStore(store: string, filter: StoreFilter) {
  if (filter === "all") return true;
  const normalized = store.toUpperCase();
  return filter === "light"
    ? normalized.includes("SHOPPING LIGHT")
    : normalized.includes("BOA VISTA");
}

function shortStore(name: string) {
  return name
    .replace(/^PANDA\s+/i, "")
    .replace("SHOPPING LIGHT", "Shopping Light")
    .replace("BOA VISTA", "Boa Vista");
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

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function selectedDateLabel(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function calculateDre(rows: SaleRow[]) {
  const grouped = new Map<
    string,
    { store: string; category: ProductCategory; cost: number; revenue: number }
  >();

  for (const row of rows) {
    const category = inferProductCategory(row.product, row.code);
    const key = `${row.store}::${category}`;
    const current = grouped.get(key) ?? {
      store: row.store,
      category,
      cost: 0,
      revenue: 0,
    };
    const sign = signFor(row);
    current.cost += sign * row.cost;
    current.revenue += sign * row.total;
    grouped.set(key, current);
  }

  const categoryOrder = new Map(
    PRODUCT_CATEGORIES.map((category, index) => [category, index]),
  );
  const reportRows: DreRow[] = [...grouped.values()]
    .map((item) => {
      const isFilm = item.category === "Películas";
      return {
        store: item.store,
        category: item.category,
        cost: item.cost,
        netCost: isFilm
          ? item.cost * (1 - 0.12) * (1 - 0.0925)
          : item.cost * (1 - 0.0925),
        revenue: item.revenue,
        netRevenue: isFilm
          ? item.revenue * (1 - 0.18) * (1 - 0.0925)
          : item.revenue * (1 - 0.0925),
        pisCofins: isFilm
          ? item.revenue * (1 - 0.18) * 0.0925
          : item.revenue * 0.0925,
        icms: isFilm ? item.revenue * 0.18 : 0,
      };
    })
    .sort(
      (a, b) =>
        a.store.localeCompare(b.store) ||
        (categoryOrder.get(a.category) ?? 99) -
          (categoryOrder.get(b.category) ?? 99),
    );

  const totals = reportRows.reduce(
    (current, row) => ({
      cost: current.cost + row.cost,
      netCost: current.netCost + row.netCost,
      revenue: current.revenue + row.revenue,
      netRevenue: current.netRevenue + row.netRevenue,
      pisCofins: current.pisCofins + row.pisCofins,
      icms: current.icms + row.icms,
    }),
    { cost: 0, netCost: 0, revenue: 0, netRevenue: 0, pisCofins: 0, icms: 0 },
  );

  return { rows: reportRows, totals };
}

export default function DrePage() {
  const [dataset, setDataset] = useState<Dataset>(initialSales as Dataset);
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("all");
  const [today] = useState(() => localDateISO());
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStart, setCustomStart] = useState(() => {
    const current = localDateISO();
    return `${current.slice(0, 7)}-01`;
  });
  const [customEnd, setCustomEnd] = useState(() => localDateISO());
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
        if (active && payload.rows?.length) setDataset(payload as Dataset);
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

  const filteredRows = useMemo(
    () =>
      dataset.rows.filter(
        (row) =>
          matchesStore(row.store, storeFilter) &&
          row.date >= activeDateRange.start &&
          row.date <= activeDateRange.end,
      ),
    [activeDateRange, dataset.rows, storeFilter],
  );
  const report = useMemo(() => calculateDre(filteredRows), [filteredRows]);

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
            <a href="/">Visão geral</a>
            <a href="/vendedores">Vendedores</a>
            <a href="/analise-diaria">Análise diária</a>
            <a href="/estoque">Análise de estoque</a>
            <a className="active" aria-current="page" href="/dre">
              Dados DRE
            </a>
          </nav>
        </div>
        <DriveSyncStatus updatedAt={updatedAt} />
      </header>

      <div className="page-shell dre-page">
        <section className="page-heading seller-page-heading">
          <div>
            <p className="eyebrow">Demonstrativo de resultados</p>
            <h1>Dados DRE</h1>
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
          </div>
        </section>

        {message && (
          <div className={`upload-message ${uploadState}`} role="status">
            {message}
          </div>
        )}

        <section className="panel dre-panel">
          <div className="panel-header">
            <div>
              <h2>DRE por loja e categoria</h2>
              <p>Faturamento, custos líquidos e débitos fiscais após devoluções</p>
            </div>
            <span>{report.rows.length} combinações</span>
          </div>
          <div className="seller-table-wrap">
            <table className="seller-detail-table dre-table">
              <thead>
                <tr>
                  <th>Loja</th>
                  <th>Cat. DRE</th>
                  <th>Custo total</th>
                  <th>Custo líq.</th>
                  <th>Faturamento</th>
                  <th>Fat. líq.</th>
                  <th>Déb. PIS/Cofins</th>
                  <th>Déb. ICMS</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={`${row.store}-${row.category}`}>
                    <td className="seller-name-cell">{shortStore(row.store)}</td>
                    <td>
                      <span className="category-badge">
                        <i
                          style={{ background: CATEGORY_COLORS[row.category] }}
                          aria-hidden="true"
                        />
                        {row.category}
                      </span>
                    </td>
                    <td>{money.format(row.cost)}</td>
                    <td>{money.format(row.netCost)}</td>
                    <td>{money.format(row.revenue)}</td>
                    <td>{money.format(row.netRevenue)}</td>
                    <td>{money.format(row.pisCofins)}</td>
                    <td>{money.format(row.icms)}</td>
                  </tr>
                ))}
              </tbody>
              {report.rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total</td>
                    <td>{money.format(report.totals.cost)}</td>
                    <td>{money.format(report.totals.netCost)}</td>
                    <td>{money.format(report.totals.revenue)}</td>
                    <td>{money.format(report.totals.netRevenue)}</td>
                    <td>{money.format(report.totals.pisCofins)}</td>
                    <td>{money.format(report.totals.icms)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {!report.rows.length && (
              <div className="seller-empty-state">
                Nenhuma venda encontrada com os filtros selecionados.
              </div>
            )}
          </div>
          <div className="dre-formula-note" aria-label="Regras de cálculo da DRE">
            <article>
              <strong>Celulares, Acessórios, Tablet e IoT</strong>
              <span>
                Custo e faturamento líquidos: base × 90,75%. PIS/Cofins:
                faturamento × 9,25%. Sem débito de ICMS nesta visão.
              </span>
            </article>
            <article>
              <strong>Películas</strong>
              <span>
                Custo líq.: custo × 88% × 90,75%. Fat. líq.: faturamento × 82% ×
                90,75%. PIS/Cofins: faturamento × 82% × 9,25%. ICMS: faturamento ×
                18%.
              </span>
            </article>
          </div>
        </section>

        <footer>
          <span>Fonte: {dataset.sourceFile}</span>
          <span>{filteredRows.length} registros na visão selecionada</span>
        </footer>
      </div>
    </main>
  );
}
