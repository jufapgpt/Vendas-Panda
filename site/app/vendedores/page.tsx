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
type CategoryFilter = "all" | ProductCategory;

type Metric = {
  revenue: number;
  units: number;
  profit: number;
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
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

function addRowMetric(metric: Metric, row: SaleRow) {
  const sign = signFor(row);
  metric.revenue += sign * row.total;
  metric.units += netQuantity(row);
  metric.profit += sign * (row.total - row.cost);
}

export default function SellersPage() {
  const [dataset, setDataset] = useState<Dataset>(initialSales as Dataset);
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("all");
  const [today] = useState(() => localDateISO());
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStart, setCustomStart] = useState(() => {
    const current = localDateISO();
    return `${current.slice(0, 7)}-01`;
  });
  const [customEnd, setCustomEnd] = useState(() => localDateISO());
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [descriptionSearch, setDescriptionSearch] = useState("");
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

  const filteredRows = useMemo(() => {
    const query = normalizeSearch(descriptionSearch);
    return dataset.rows.filter((row) => {
      const category = inferProductCategory(row.product, row.code);
      return (
        matchesStore(row.store, storeFilter) &&
        row.date >= activeDateRange.start &&
        row.date <= activeDateRange.end &&
        (categoryFilter === "all" || category === categoryFilter) &&
        (!query || normalizeSearch(`${row.product} ${row.code}`).includes(query))
      );
    });
  }, [activeDateRange, categoryFilter, dataset.rows, descriptionSearch, storeFilter]);

  const report = useMemo(() => {
    const totals: Metric = { revenue: 0, units: 0, profit: 0 };
    const sellers = new Map<
      string,
      Metric & { categories: Record<ProductCategory, Metric> }
    >();
    const products = new Map<
      string,
      Metric & {
        seller: string;
        category: ProductCategory;
        code: string;
        product: string;
      }
    >();

    for (const row of filteredRows) {
      const sellerName = row.seller || "Não informado";
      const category = inferProductCategory(row.product, row.code);
      addRowMetric(totals, row);

      const seller = sellers.get(sellerName) ?? {
        revenue: 0,
        units: 0,
        profit: 0,
        categories: Object.fromEntries(
          PRODUCT_CATEGORIES.map((name) => [
            name,
            { revenue: 0, units: 0, profit: 0 },
          ]),
        ) as Record<ProductCategory, Metric>,
      };
      addRowMetric(seller, row);
      addRowMetric(seller.categories[category], row);
      sellers.set(sellerName, seller);

      const productKey = `${sellerName}::${category}::${row.code}::${row.product}`;
      const product = products.get(productKey) ?? {
        seller: sellerName,
        category,
        code: row.code,
        product: row.product,
        revenue: 0,
        units: 0,
        profit: 0,
      };
      addRowMetric(product, row);
      products.set(productKey, product);
    }

    return {
      totals,
      sellers: [...sellers.entries()]
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => b.revenue - a.revenue),
      products: [...products.values()].sort(
        (a, b) =>
          b.revenue - a.revenue ||
          a.seller.localeCompare(b.seller) ||
          a.product.localeCompare(b.product),
      ),
    };
  }, [filteredRows]);

  const visibleCategories =
    categoryFilter === "all" ? PRODUCT_CATEGORIES : [categoryFilter];

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
            <a className="active" aria-current="page" href="/vendedores">
              Vendedores
            </a>
            <a href="/analise-diaria">Análise diária</a>
            <a href="/estoque">Análise de estoque</a>
            <a href="/dre">Dados DRE</a>
          </nav>
        </div>
        <DriveSyncStatus updatedAt={updatedAt} />
      </header>

      <div className="page-shell seller-report-page">
        <section className="page-heading seller-page-heading">
          <div>
            <p className="eyebrow">Performance da equipe</p>
            <h1>Vendas por vendedor</h1>
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

        <section className="seller-filter-bar" aria-label="Filtros do relatório">
          <div className="seller-filter-label">Categoria</div>
          <div className="category-filter" role="group" aria-label="Filtrar por categoria">
            {(["all", ...PRODUCT_CATEGORIES] as CategoryFilter[]).map((category) => (
              <button
                type="button"
                className={categoryFilter === category ? "active" : ""}
                aria-pressed={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
                key={category}
              >
                {category === "all" ? "Todas" : category}
              </button>
            ))}
          </div>
          <label className="description-filter">
            <span>Buscar descrição</span>
            <input
              type="search"
              value={descriptionSearch}
              placeholder="Digite produto ou código…"
              onChange={(event) => setDescriptionSearch(event.target.value)}
            />
          </label>
        </section>

        {message && (
          <div className={`upload-message ${uploadState}`} role="status">
            {message}
          </div>
        )}

        <section className="kpi-strip seller-kpis" aria-label="Resumo do relatório">
          {[
            ["Receita líquida", money.format(report.totals.revenue), "Após devoluções"],
            ["Lucro bruto", money.format(report.totals.profit), "Receita menos custo"],
            [
              "Margem",
              report.totals.revenue
                ? percentTwo.format(report.totals.profit / report.totals.revenue)
                : "—",
              "Sobre a receita líquida",
            ],
            ["Itens líquidos", integer.format(report.totals.units), "Unidades no filtro"],
            ["Vendedores", integer.format(report.sellers.length), "Com movimentação"],
          ].map(([label, value, note], index) => (
            <article className={index === 0 ? "kpi-card active" : "kpi-card"} key={label}>
              <p>{label}</p>
              <strong>{value}</strong>
              <span>{note}</span>
            </article>
          ))}
        </section>

        <section className="panel seller-matrix-panel">
          <div className="panel-header">
            <div>
              <h2>Vendas por vendedor e categoria</h2>
              <p>Receita líquida e quantidade de itens em cada categoria</p>
            </div>
            <span>{report.sellers.length} vendedores</span>
          </div>
          <div className="seller-table-wrap">
            <table className="seller-matrix">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vendedor</th>
                  {visibleCategories.map((category) => (
                    <th key={category}>{category}</th>
                  ))}
                  <th>Total</th>
                  <th>Itens</th>
                  <th>Margem</th>
                </tr>
              </thead>
              <tbody>
                {report.sellers.map((seller, index) => (
                  <tr key={seller.name}>
                    <td className="rank-cell">{String(index + 1).padStart(2, "0")}</td>
                    <td className="seller-name-cell">{seller.name}</td>
                    {visibleCategories.map((category) => {
                      const metric = seller.categories[category];
                      return (
                        <td key={category}>
                          <strong>{money.format(metric.revenue)}</strong>
                          <small>{integer.format(metric.units)} itens</small>
                        </td>
                      );
                    })}
                    <td className="total-cell">{money.format(seller.revenue)}</td>
                    <td>{integer.format(seller.units)}</td>
                    <td className={seller.profit < 0 ? "negative-cell" : "positive-cell"}>
                      <strong>{money.format(seller.profit)}</strong>
                      <small>
                        {seller.revenue
                          ? percentTwo.format(seller.profit / seller.revenue)
                          : "—"}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!report.sellers.length && (
              <div className="seller-empty-state">
                Nenhuma venda encontrada com os filtros selecionados.
              </div>
            )}
          </div>
        </section>

        <section className="panel seller-detail-panel">
          <div className="panel-header">
            <div>
              <h2>Detalhamento por produto</h2>
              <p>Produtos vendidos, agrupados por vendedor e categoria</p>
            </div>
            <span>{report.products.length} combinações</span>
          </div>
          <div className="seller-table-wrap">
            <table className="seller-detail-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Categoria</th>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Itens</th>
                  <th>Receita líquida</th>
                  <th>Margem R$</th>
                  <th>Margem %</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((product) => (
                  <tr key={`${product.seller}-${product.category}-${product.code}-${product.product}`}>
                    <td className="seller-name-cell">{product.seller}</td>
                    <td>
                      <span className="category-badge">
                        <i style={{ background: CATEGORY_COLORS[product.category] }} />
                        {product.category}
                      </span>
                    </td>
                    <td>{product.code}</td>
                    <td className="product-description-cell">{product.product}</td>
                    <td>{integer.format(product.units)}</td>
                    <td className="total-cell">{money.format(product.revenue)}</td>
                    <td className={product.profit < 0 ? "negative-cell" : ""}>
                      {money.format(product.profit)}
                    </td>
                    <td className={product.profit < 0 ? "negative-cell" : "positive-cell"}>
                      {product.revenue
                        ? percentTwo.format(product.profit / product.revenue)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!report.products.length && (
              <div className="seller-empty-state">
                Nenhum produto encontrado com os filtros selecionados.
              </div>
            )}
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
