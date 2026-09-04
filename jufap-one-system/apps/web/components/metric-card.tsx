import type { MetricSnapshot } from "@jufap-one/core";
import { formatPercent, formatValue } from "../lib/format";

export function MetricCard({ metric }: { metric: MetricSnapshot }) {
  const progress = metric.trendAchievement ?? metric.achievement ?? 0;
  const width = Math.max(0, Math.min(progress, 1.25)) / 1.25 * 100;

  return (
    <article className={`metric-card severity-${metric.severity}`}>
      <div className="metric-card__top">
        <span>{metric.label}</span>
        <strong>{metric.severity === "positive" ? "Acima" : metric.severity === "critical" ? "Crítico" : "Atenção"}</strong>
      </div>
      <div className="metric-card__value">{formatValue(metric.value, metric.unit)}</div>
      <div className="metric-card__context">
        {metric.goal !== null ? `${formatPercent(metric.achievement)} da meta` : "Situações que pedem atuação"}
      </div>
      <div className="metric-card__progress" aria-label="Progresso projetado">
        <span style={{ width: `${width}%` }} />
      </div>
      <footer>
        <span>Tendência <b>{formatValue(metric.trend, metric.unit)}</b></span>
        <span>Comparável <b>{formatPercent(metric.comparison)}</b></span>
      </footer>
    </article>
  );
}
