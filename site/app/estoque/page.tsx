"use client";

import { useEffect, useMemo, useState } from "react";
import initialSales from "../data/initial-sales.json";
import initialStock from "../data/initial-stock.json";
import { DriveSyncStatus } from "../drive-sync-status";
import type { SaleRow } from "../../lib/sales";
import type { StockRow } from "../../lib/stock";
import { formatBrasiliaDateTime } from "../../lib/date-time";
import {
  PRODUCT_CATEGORIES,
  classifyProduct,
  type ProductCategory,
} from "../../lib/categories";

type Dataset = { sourceFile: string; uploadedAt: string; rows: SaleRow[] };
type StockDataset = { sourceFiles: string[]; uploadedAt: string; rows: StockRow[] };
type StoreFilter = "all" | "light" | "boa-vista";
type CategoryFilter = "all" | ProductCategory;
type WosFilter = "all" | "critical" | "replenish" | "ideal" | "excess";
type ProductSortKey =
  | "description"
  | "stock"
  | "sales28"
  | "wos28"
  | "sales7"
  | "wos7"
  | "salesYesterday"
  | "salesToday"
  | "stockCost"
  | "averageCost";
type SortDirection = "asc" | "desc";

type InventoryItem = {
  key: string;
  code: string;
  description: string;
  category: ProductCategory;
  stock: number;
  stockCost: number;
  averageCost: number | null;
  sales28: number;
  sales7: number;
  salesYesterday: number;
  salesToday: number;
  wos28: number | null;
  wos7: number | null;
  status: Exclude<WosFilter, "all">;
};

type SummaryRow = {
  label: string;
  stock: number;
  stockCost: number;
  averageCost: number | null;
  sales28: number;
  sales7: number;
  salesYesterday: number;
  salesToday: number;
  wos28: number | null;
  wos7: number | null;
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

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

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function itemKey(code: string, product: string) {
  return normalize(code).replace(/\s+/g, "") || normalize(product);
}

function wosClass(value: number | null) {
  if (value === null || value > 8) return "wos-excess";
  if (value >= 4) return "wos-ideal";
  if (value > 0) return "wos-replenish";
  return "wos-critical";
}

function wosStatus(stock: number, wos7: number | null): InventoryItem["status"] {
  if (stock <= 0) return "critical";
  if (wos7 === null || wos7 > 8) return "excess";
  if (wos7 < 4) return "replenish";
  return "ideal";
}

function formatWos(value: number | null) {
  return value === null ? "Infinito" : number.format(value);
}

function summaryRow(
  label: string,
  values: Omit<SummaryRow, "label" | "averageCost" | "wos28" | "wos7">,
): SummaryRow {
  return {
    label,
    ...values,
    averageCost: values.stock !== 0 ? values.stockCost / values.stock : null,
    wos28: values.sales28 > 0 ? values.stock / (values.sales28 / 4) : null,
    wos7: values.sales7 > 0 ? values.stock / values.sales7 : null,
  };
}

function WosSummaryTable({
  title,
  subtitle,
  firstColumn,
  rows,
  total,
}: {
  title: string;
  subtitle: string;
  firstColumn: string;
  rows: SummaryRow[];
  total: SummaryRow;
}) {
  return (
    <article className="panel inventory-summary-panel">
      <div className="panel-header">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <span>{rows.length} linhas</span>
      </div>
      <div className="inventory-summary-table-wrap">
        <table className="inventory-summary-table">
          <thead><tr>
            <th>{firstColumn}</th><th>Saldo<br />estoque</th><th>Vendas<br />28 dias</th><th>WOS<br />28 dias</th><th>Vendas<br />7 dias</th><th>WOS<br />7 dias</th><th>Vendas<br />ontem</th><th>Vendas<br />hoje</th><th>Custo<br />estoque</th><th>Custo<br />médio</th>
          </tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.label}>
              <td>{row.label}</td><td>{number.format(row.stock)}</td><td>{number.format(row.sales28)}</td><td className={`wos-cell ${wosClass(row.wos28)}`}>{formatWos(row.wos28)}</td><td>{number.format(row.sales7)}</td><td className={`wos-cell ${wosClass(row.wos7)}`}>{formatWos(row.wos7)}</td><td>{number.format(row.salesYesterday)}</td><td>{number.format(row.salesToday)}</td><td>{money.format(row.stockCost)}</td><td>{row.averageCost === null ? "—" : money.format(row.averageCost)}</td>
            </tr>)}
          </tbody>
          <tfoot><tr>
            <td>Total</td><td>{number.format(total.stock)}</td><td>{number.format(total.sales28)}</td><td>{formatWos(total.wos28)}</td><td>{number.format(total.sales7)}</td><td>{formatWos(total.wos7)}</td><td>{number.format(total.salesYesterday)}</td><td>{number.format(total.salesToday)}</td><td>{money.format(total.stockCost)}</td><td>{total.averageCost === null ? "—" : money.format(total.averageCost)}</td>
          </tr></tfoot>
        </table>
      </div>
    </article>
  );
}

function SortableProductHeader({
  column,
  label,
  sortKey,
  direction,
  onSort,
  children,
}: {
  column: ProductSortKey;
  label: string;
  sortKey: ProductSortKey;
  direction: SortDirection;
  onSort: (column: ProductSortKey) => void;
  children: React.ReactNode;
}) {
  const active = sortKey === column;
  return (
    <th aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className={`inventory-sort-button ${column === "description" ? "description" : ""} ${active ? "active" : ""}`}
        onClick={() => onSort(column)}
        aria-label={`Ordenar por ${label}${active ? `, ordem ${direction === "asc" ? "crescente" : "decrescente"}` : ""}`}
      >
        <span>{children}</span>
        <span className="inventory-sort-arrows" aria-hidden="true">
          <i className={active && direction === "asc" ? "selected" : ""}>▲</i>
          <i className={active && direction === "desc" ? "selected" : ""}>▼</i>
        </span>
      </button>
    </th>
  );
}

export default function InventoryAnalysisPage() {
  const [dataset, setDataset] = useState<Dataset>(initialSales as Dataset);
  const [stockDataset, setStockDataset] = useState<StockDataset>(initialStock as StockDataset);
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [wosFilter, setWosFilter] = useState<WosFilter>("all");
  const [search, setSearch] = useState("");
  const [productSort, setProductSort] = useState<{
    key: ProductSortKey;
    direction: SortDirection;
  }>({ key: "description", direction: "asc" });
  const [today] = useState(() => localDateISO());

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        if (payload.rows?.length) setDataset(payload as Dataset);
        if (payload.stockRows?.length) {
          setStockDataset({
            sourceFiles: payload.stockSourceFiles ?? [],
            uploadedAt: payload.stockUploadedAt ?? payload.uploadedAt,
            rows: payload.stockRows,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const report = useMemo(() => {
    const yesterday = shiftDate(today, -1);
    const start7 = shiftDate(today, -7);
    const start28 = shiftDate(today, -28);
    const items = new Map<
      string,
      Omit<InventoryItem, "averageCost" | "wos28" | "wos7" | "status">
    >();

    for (const row of stockDataset.rows) {
      if (!matchesStore(row.store, storeFilter)) continue;
      const key = itemKey(row.code, row.product);
      const current = items.get(key) ?? {
        key,
        code: row.code,
        description: row.product,
        category: classifyProduct(row.product, row.code).category,
        stock: 0,
        stockCost: 0,
        sales28: 0,
        sales7: 0,
        salesYesterday: 0,
        salesToday: 0,
      };
      if (row.product.length > current.description.length) current.description = row.product;
      current.stock += row.quantity;
      current.stockCost += row.cost;
      items.set(key, current);
    }

    for (const row of dataset.rows) {
      if (!matchesStore(row.store, storeFilter)) continue;
      if (row.date < start28 || row.date > today) continue;
      const key = itemKey(row.code, row.product);
      const current = items.get(key) ?? {
        key,
        code: row.code,
        description: row.product,
        category: classifyProduct(row.product, row.code).category,
        stock: 0,
        stockCost: 0,
        sales28: 0,
        sales7: 0,
        salesYesterday: 0,
        salesToday: 0,
      };
      if (row.product.length > current.description.length) current.description = row.product;
      const quantity = netQuantity(row);
      if (row.date >= start28 && row.date <= yesterday) current.sales28 += quantity;
      if (row.date >= start7 && row.date <= yesterday) current.sales7 += quantity;
      if (row.date === yesterday) current.salesYesterday += quantity;
      if (row.date === today) current.salesToday += quantity;
      items.set(key, current);
    }

    const allItems: InventoryItem[] = [...items.values()]
      .map((item) => {
        const wos28 = item.sales28 > 0 ? item.stock / (item.sales28 / 4) : null;
        const wos7 = item.sales7 > 0 ? item.stock / item.sales7 : null;
        return {
          ...item,
          averageCost: item.stock !== 0 ? item.stockCost / item.stock : null,
          wos28,
          wos7,
          status: wosStatus(item.stock, wos7),
        };
      })
      .sort((a, b) => a.description.localeCompare(b.description));

    const query = normalize(search);
    const visible = allItems.filter(
      (item) =>
        (categoryFilter === "all" || item.category === categoryFilter) &&
        (wosFilter === "all" || item.status === wosFilter) &&
        (!query || normalize(`${item.description} ${item.code}`).includes(query)),
    );
    const totals = visible.reduce(
      (sum, item) => ({
        stock: sum.stock + item.stock,
        stockCost: sum.stockCost + item.stockCost,
        sales28: sum.sales28 + item.sales28,
        sales7: sum.sales7 + item.sales7,
        salesYesterday: sum.salesYesterday + item.salesYesterday,
        salesToday: sum.salesToday + item.salesToday,
      }),
      { stock: 0, stockCost: 0, sales28: 0, sales7: 0, salesYesterday: 0, salesToday: 0 },
    );
    const totalSummary = summaryRow("Total", totals);
    const categoryMap = new Map<
      ProductCategory,
      Omit<SummaryRow, "label" | "averageCost" | "wos28" | "wos7">
    >();
    for (const item of visible) {
      const current = categoryMap.get(item.category) ?? {
        stock: 0,
        stockCost: 0,
        sales28: 0,
        sales7: 0,
        salesYesterday: 0,
        salesToday: 0,
      };
      current.stock += item.stock;
      current.stockCost += item.stockCost;
      current.sales28 += item.sales28;
      current.sales7 += item.sales7;
      current.salesYesterday += item.salesYesterday;
      current.salesToday += item.salesToday;
      categoryMap.set(item.category, current);
    }
    const categorySummary = PRODUCT_CATEGORIES
      .filter((category) => categoryMap.has(category))
      .map((category) => summaryRow(category, categoryMap.get(category)!));

    const selectedKeys = new Set(visible.map((item) => item.key));
    const storeChoices: Array<{ filter: StoreFilter; label: string }> =
      storeFilter === "all"
        ? [
            { filter: "light", label: "Shopping Light" },
            { filter: "boa-vista", label: "Boa Vista" },
          ]
        : [
            {
              filter: storeFilter,
              label: storeFilter === "light" ? "Shopping Light" : "Boa Vista",
            },
          ];
    const storeSummary = storeChoices.map(({ filter, label }) => {
      const values = {
        stock: 0,
        stockCost: 0,
        sales28: 0,
        sales7: 0,
        salesYesterday: 0,
        salesToday: 0,
      };
      for (const row of stockDataset.rows) {
        if (!matchesStore(row.store, filter)) continue;
        if (!selectedKeys.has(itemKey(row.code, row.product))) continue;
        values.stock += row.quantity;
        values.stockCost += row.cost;
      }
      for (const row of dataset.rows) {
        if (!matchesStore(row.store, filter)) continue;
        if (row.date < start28 || row.date > today) continue;
        if (!selectedKeys.has(itemKey(row.code, row.product))) continue;
        const quantity = netQuantity(row);
        if (row.date >= start28 && row.date <= yesterday) values.sales28 += quantity;
        if (row.date >= start7 && row.date <= yesterday) values.sales7 += quantity;
        if (row.date === yesterday) values.salesYesterday += quantity;
        if (row.date === today) values.salesToday += quantity;
      }
      return summaryRow(label, values);
    });
    return {
      visible,
      totals,
      totalSummary,
      categorySummary,
      storeSummary,
      totalWos28: totals.sales28 > 0 ? totals.stock / (totals.sales28 / 4) : null,
      totalWos7: totals.sales7 > 0 ? totals.stock / totals.sales7 : null,
      averageCost: totals.stock !== 0 ? totals.stockCost / totals.stock : null,
      yesterday,
      start7,
      start28,
    };
  }, [categoryFilter, dataset.rows, search, stockDataset.rows, storeFilter, today, wosFilter]);

  const sortedProducts = useMemo(() => {
    const sorted = [...report.visible];
    sorted.sort((a, b) => {
      let comparison: number;
      if (productSort.key === "description") {
        comparison = a.description.localeCompare(b.description, "pt-BR", {
          numeric: true,
          sensitivity: "base",
        });
      } else {
        const aValue = a[productSort.key] ?? Number.POSITIVE_INFINITY;
        const bValue = b[productSort.key] ?? Number.POSITIVE_INFINITY;
        comparison = aValue - bValue;
      }
      if (comparison === 0) {
        comparison = a.description.localeCompare(b.description, "pt-BR", {
          numeric: true,
          sensitivity: "base",
        });
      }
      return productSort.direction === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [productSort, report.visible]);

  function sortProductsBy(column: ProductSortKey) {
    setProductSort((current) => ({
      key: column,
      direction:
        current.key === column
          ? current.direction === "asc" ? "desc" : "asc"
          : column === "description" ? "asc" : "desc",
    }));
  }

  const updatedAt = formatBrasiliaDateTime(stockDataset.uploadedAt);

  const statusLabels: Record<WosFilter, string> = {
    all: "Todos",
    critical: "Sem estoque",
    replenish: "Repor",
    ideal: "Ideal 4–8",
    excess: "Excesso / sem giro",
  };

  return (
    <main>
      <header className="topbar">
        <div className="topbar-main">
          <div className="brand">
            <span className="brand-logo-frame"><img className="brand-logo" src="/logo-panda.png" alt="Panda" /></span>
            <span>Varejo Analytics</span>
          </div>
          <nav className="report-tabs" aria-label="Relatórios">
            <a href="/">Visão geral</a>
            <a href="/vendedores">Vendedores</a>
            <a href="/analise-diaria">Análise diária</a>
            <a className="active" aria-current="page" href="/estoque">Análise de estoque</a>
            <a href="/dre">Dados DRE</a>
          </nav>
        </div>
        <DriveSyncStatus updatedAt={updatedAt} label="Estoque atualizado" />
      </header>

      <div className="page-shell inventory-analysis-page">
        <section className="page-heading inventory-heading">
          <div>
            <p className="eyebrow">Cobertura e giro</p>
            <h1>Análise de Estoque</h1>
            <p>Posição atual comparada às vendas até {new Date(`${report.yesterday}T12:00:00`).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="store-filter" role="group" aria-label="Filtrar por loja">
            {[["all", "Lojas"], ["light", "Light"], ["boa-vista", "Boavista"]].map(([value, label]) => (
              <button type="button" className={storeFilter === value ? "active" : ""} aria-pressed={storeFilter === value} onClick={() => setStoreFilter(value as StoreFilter)} key={value}>{label}</button>
            ))}
          </div>
        </section>

        <section className="inventory-filter-bar" aria-label="Filtros da análise de estoque">
          <label className="inventory-search"><span>Buscar descrição</span><input type="search" value={search} placeholder="Digite produto ou código…" onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="inventory-filter-group">
            <span>Categoria</span>
            <div className="category-filter" role="group" aria-label="Filtrar por categoria">
              {(["all", ...PRODUCT_CATEGORIES] as CategoryFilter[]).map((category) => (
                <button type="button" className={categoryFilter === category ? "active" : ""} aria-pressed={categoryFilter === category} onClick={() => setCategoryFilter(category)} key={category}>{category === "all" ? "Todas" : category}</button>
              ))}
            </div>
          </div>
          <div className="inventory-filter-group">
            <span>Situação WOS 7</span>
            <div className="wos-filter" role="group" aria-label="Filtrar por situação de cobertura">
              {(Object.keys(statusLabels) as WosFilter[]).map((status) => (
                <button type="button" className={wosFilter === status ? `active status-${status}` : ""} aria-pressed={wosFilter === status} onClick={() => setWosFilter(status)} key={status}>{statusLabels[status]}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="inventory-summary-grid" aria-label="Resumo do WOS por categoria e loja">
          <WosSummaryTable
            title="WOS por categoria"
            subtitle="Cobertura consolidada dos itens exibidos"
            firstColumn="Categoria"
            rows={report.categorySummary}
            total={report.totalSummary}
          />
          <WosSummaryTable
            title="WOS por loja"
            subtitle="Comparativo com os mesmos filtros da página"
            firstColumn="Loja"
            rows={report.storeSummary}
            total={report.totalSummary}
          />
        </section>

        <section className="panel inventory-analysis-panel">
          <div className="panel-header">
            <div><h2>WOS por produto</h2><p>WOS em semanas; vendas líquidas já descontadas das devoluções</p></div>
            <span>{report.visible.length} itens</span>
          </div>
          <div className="inventory-table-wrap">
            <table className="inventory-analysis-table">
              <thead><tr>
                <SortableProductHeader column="description" label="Descrição" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Descrição</SortableProductHeader>
                <SortableProductHeader column="stock" label="Saldo em estoque" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Saldo<br />estoque</SortableProductHeader>
                <SortableProductHeader column="sales28" label="Vendas em 28 dias" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Vendas<br />28 dias</SortableProductHeader>
                <SortableProductHeader column="wos28" label="WOS de 28 dias" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>WOS<br />28 dias</SortableProductHeader>
                <SortableProductHeader column="sales7" label="Vendas em 7 dias" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Vendas<br />7 dias</SortableProductHeader>
                <SortableProductHeader column="wos7" label="WOS de 7 dias" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>WOS<br />7 dias</SortableProductHeader>
                <SortableProductHeader column="salesYesterday" label="Vendas de ontem" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Vendas<br />ontem</SortableProductHeader>
                <SortableProductHeader column="salesToday" label="Vendas de hoje" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Vendas<br />hoje</SortableProductHeader>
                <SortableProductHeader column="stockCost" label="Custo do estoque" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Custo<br />estoque</SortableProductHeader>
                <SortableProductHeader column="averageCost" label="Custo médio" sortKey={productSort.key} direction={productSort.direction} onSort={sortProductsBy}>Custo<br />médio</SortableProductHeader>
              </tr></thead>
              <tbody>
                {sortedProducts.map((item) => (
                  <tr key={item.key}>
                    <td><strong>{item.description}</strong><small>{item.code} · {item.category}</small></td>
                    <td className={item.stock <= 0 ? "negative-cell" : ""}>{number.format(item.stock)}</td>
                    <td>{number.format(item.sales28)}</td>
                    <td className={`wos-cell ${wosClass(item.wos28)}`}>{formatWos(item.wos28)}</td>
                    <td>{number.format(item.sales7)}</td>
                    <td className={`wos-cell ${wosClass(item.wos7)}`}>{formatWos(item.wos7)}</td>
                    <td>{number.format(item.salesYesterday)}</td><td>{number.format(item.salesToday)}</td>
                    <td>{money.format(item.stockCost)}</td><td>{item.averageCost === null ? "—" : money.format(item.averageCost)}</td>
                  </tr>
                ))}
              </tbody>
              {report.visible.length > 0 && <tfoot><tr>
                <td>Total</td><td>{number.format(report.totals.stock)}</td><td>{number.format(report.totals.sales28)}</td><td>{formatWos(report.totalWos28)}</td><td>{number.format(report.totals.sales7)}</td><td>{formatWos(report.totalWos7)}</td><td>{number.format(report.totals.salesYesterday)}</td><td>{number.format(report.totals.salesToday)}</td><td>{money.format(report.totals.stockCost)}</td><td>{report.averageCost === null ? "—" : money.format(report.averageCost)}</td>
              </tr></tfoot>}
            </table>
            {!report.visible.length && <div className="seller-empty-state">Nenhum item encontrado com os filtros selecionados.</div>}
          </div>
          <div className="inventory-formula-note">
            <span><b>WOS 28:</b> estoque ÷ (vendas de {report.start28.split("-").reverse().join("/")} a {report.yesterday.split("-").reverse().join("/")} ÷ 4)</span>
            <span><b>WOS 7:</b> estoque ÷ vendas de {report.start7.split("-").reverse().join("/")} a {report.yesterday.split("-").reverse().join("/")}</span>
            <span>“Infinito” indica ausência de venda líquida na janela.</span>
          </div>
        </section>

        <footer><span>Estoque: {stockDataset.sourceFiles.join(" · ")}</span><span>Vendas: {dataset.sourceFile}</span></footer>
      </div>
    </main>
  );
}
