import type { MetricUnit } from "@jufap-one/core";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export function formatValue(value: number | null, unit: MetricUnit): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (unit === "currency") return currency.format(value);
  if (unit === "percent") return `${decimal.format(value * 100)}%`;
  if (unit === "hours") return `${decimal.format(value)}h`;
  if (unit === "days") return `${decimal.format(value)} dias`;
  if (unit === "score") return decimal.format(value);
  return decimal.format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${decimal.format(value * 100)}%`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function compactCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
