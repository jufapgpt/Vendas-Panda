"use client";

import {
  ChangeEvent,
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import initialSales from "../data/initial-sales.json";
import { DriveSyncStatus } from "../drive-sync-status";
import type { SaleRow } from "../../lib/sales";
import { formatBrasiliaDateTime } from "../../lib/date-time";

type Dataset = {
  sourceFile: string;
  uploadedAt: string;
  rows: SaleRow[];
};

type StoreFilter = "all" | "light" | "boa-vista";
type DateFilter = "month" | "previous-month" | "today" | "yesterday" | "custom";

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

function dayLabel(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  const weekday = value
    .toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
    .replace(".", "");
  return `${date.slice(8, 10)} (${weekday})`;
}

export default function DailyAnalysisPage() {
  const [dataset, setDataset] = useState<Dataset>(initialSales as Dataset);
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("all");
  const [today] = useState(() => localDateISO());
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStart, setCustomStart] = useState(() => `${localDateISO().slice(0, 7)}-01`);
  const [customEnd, setCustomEnd] = useState(() => localDateISO());
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
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

  const report = useMemo(() => {
    const rows = dataset.rows.filter(
      (row) =>
        matchesStore(row.store, storeFilter) &&
        row.date >= activeDateRange.start &&
        row.date <= activeDateRange.end,
    );
    const stores = [...new Set(rows.map((row) => row.store))].sort((a, b) => {
      const order = (name: string) =>
        name.toUpperCase().includes("SHOPPING LIGHT") ? 0 : 1;
      return order(a) - order(b) || a.localeCompare(b);
    });
    const days = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const values = days.get(row.date) ?? {};
      values[row.store] = (values[row.store] ?? 0) + signFor(row) * row.total;
      days.set(row.date, values);
    }
    const daily = [...days.entries()]
      .map(([date, values]) => ({
        date,
        values,
        total: stores.reduce((sum, store) => sum + (values[store] ?? 0), 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const totals = Object.fromEntries(
      stores.map((store) => [
        store,
        daily.reduce((sum, day) => sum + (day.values[store] ?? 0), 0),
      ]),
    );
    const maxima = Object.fromEntries(
      stores.map((store) => [
        store,
        Math.max(...daily.map((day) => Math.abs(day.values[store] ?? 0)), 1),
      ]),
    );
    return {
      rows,
      stores,
      daily,
      totals,
      maxima,
      grandTotal: daily.reduce((sum, day) => sum + day.total, 0),
    };
  }, [activeDateRange, dataset.rows, storeFilter]);

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
      setMessage(error instanceof Error ? error.message : "Não foi possível importar a planilha.");
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
            <a className="active" aria-current="page" href="/analise-diaria">Análise diária</a>
            <a href="/estoque">Análise de estoque</a>
            <a href="/dre">Dados DRE</a>
          </nav>
        </div>
        <DriveSyncStatus updatedAt={updatedAt} />
      </header>

      <div className="page-shell daily-analysis-page">
        <section className="page-heading seller-page-heading">
          <div>
            <p className="eyebrow">Acompanhamento diário</p>
            <h1>Análise diária de vendas</h1>
            <p>
              {selectedDateLabel(activeDateRange.start, activeDateRange.end)} · {storeFilter === "all" ? "Todas as lojas" : storeFilter === "light" ? "Shopping Light" : "Boa Vista"}
            </p>
          </div>
          <div className="heading-controls">
            <div className="store-filter" role="group" aria-label="Filtrar por loja">
              {[["all", "Lojas"], ["light", "Light"], ["boa-vista", "Boavista"]].map(([value, label]) => (
                <button type="button" className={storeFilter === value ? "active" : ""} aria-pressed={storeFilter === value} onClick={() => setStoreFilter(value as StoreFilter)} key={value}>{label}</button>
              ))}
            </div>
            <div className="date-filter-wrap">
              <div className="date-filter" role="group" aria-label="Filtrar por período">
                {[["month", "Mês atual"], ["previous-month", "Mês anterior"], ["today", "Hoje"], ["yesterday", "Ontem"], ["custom", "Período"]].map(([value, label]) => (
                  <button type="button" className={dateFilter === value ? "active" : ""} aria-pressed={dateFilter === value} onClick={() => setDateFilter(value as DateFilter)} key={value}>{label}</button>
                ))}
              </div>
              {dateFilter === "custom" && (
                <div className="date-range-inputs">
                  <label><span>Data inicial</span><input type="date" value={customStart} max={customEnd} required onChange={(event) => event.target.value && setCustomStart(event.target.value)} /></label>
                  <i aria-hidden="true">até</i>
                  <label><span>Data final</span><input type="date" value={customEnd} min={customStart} max={today} required onChange={(event) => event.target.value && setCustomEnd(event.target.value)} /></label>
                </div>
              )}
            </div>
          </div>
        </section>

        {message && <div className={`upload-message ${uploadState}`} role="status">{message}</div>}

        <section className="panel daily-analysis-panel">
          <div className="panel-header">
            <div>
              <h2>Venda líquida por dia e loja</h2>
              <p>Valores de venda já descontados das devoluções</p>
            </div>
            <span>{report.daily.length} dias com movimentação</span>
          </div>
          <div className="daily-table-wrap">
            <table className="daily-analysis-table">
              <thead>
                <tr>
                  <th>Dia da semana</th>
                  {report.stores.map((store) => <th key={store}>{shortStore(store)}</th>)}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {report.daily.map((day) => (
                  <tr key={day.date}>
                    <td>{dayLabel(day.date)}</td>
                    {report.stores.map((store) => {
                      const value = day.values[store] ?? 0;
                      const width = Math.min((Math.abs(value) / report.maxima[store]) * 100, 100);
                      return (
                        <td className={value < 0 ? "daily-value negative" : "daily-value"} key={store}>
                          <span className="daily-data-bar" style={{ "--bar-width": `${width}%` } as CSSProperties}>{money.format(value)}</span>
                        </td>
                      );
                    })}
                    <td className={day.total < 0 ? "daily-total negative" : "daily-total"}>{money.format(day.total)}</td>
                  </tr>
                ))}
              </tbody>
              {report.daily.length > 0 && (
                <tfoot>
                  <tr>
                    <td>Total</td>
                    {report.stores.map((store) => <td key={store}>{money.format(report.totals[store] ?? 0)}</td>)}
                    <td>{money.format(report.grandTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {!report.daily.length && <div className="seller-empty-state">Nenhuma venda encontrada no período selecionado.</div>}
          </div>
        </section>

        <footer>
          <span>Fonte: {dataset.sourceFile}</span>
          <span>{report.rows.length} registros na visão selecionada</span>
        </footer>
      </div>
    </main>
  );
}
