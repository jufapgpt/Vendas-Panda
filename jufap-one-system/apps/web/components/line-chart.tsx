import type { RhythmPoint } from "@jufap-one/core";

const WIDTH = 760;
const HEIGHT = 245;
const PADDING_X = 34;
const PADDING_Y = 24;

function buildPoints(values: number[], min: number, max: number): string {
  const range = Math.max(1, max - min);
  return values
    .map((value, index) => {
      const x = PADDING_X + index * ((WIDTH - PADDING_X * 2) / Math.max(1, values.length - 1));
      const y = HEIGHT - PADDING_Y - ((value - min) / range) * (HEIGHT - PADDING_Y * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function LineChart({ points }: { points: RhythmPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="chart-card chart-card--empty">
        <strong>Sem série temporal disponível</strong>
        <span>A série será exibida após a primeira carga oficial para o filtro selecionado.</span>
      </div>
    );
  }

  const values = points.flatMap((point) => [point.current, point.goal, point.previous]);
  const min = Math.min(...values) * 0.92;
  const max = Math.max(...values) * 1.05;
  const current = buildPoints(points.map((point) => point.current), min, max);
  const goal = buildPoints(points.map((point) => point.goal), min, max);
  const previous = buildPoints(points.map((point) => point.previous), min, max);

  return (
    <div className="chart-card">
      <div className="chart-card__legend">
        <span><i className="legend-current" />Atual</span>
        <span><i className="legend-goal" />Meta</span>
        <span><i className="legend-previous" />Comparável</span>
      </div>
      <svg className="line-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Evolução diária, meta e período comparável">
        {[0, 1, 2, 3, 4].map((row) => {
          const y = PADDING_Y + row * ((HEIGHT - PADDING_Y * 2) / 4);
          return <line key={row} x1={PADDING_X} x2={WIDTH - PADDING_X} y1={y} y2={y} className="chart-grid" />;
        })}
        <polyline points={previous} className="chart-line chart-line--previous" />
        <polyline points={goal} className="chart-line chart-line--goal" />
        <polyline points={current} className="chart-line chart-line--current" />
        {points.map((point, index) => {
          const x = PADDING_X + index * ((WIDTH - PADDING_X * 2) / Math.max(1, points.length - 1));
          return <text key={point.label} x={x} y={HEIGHT - 4} textAnchor="middle" className="chart-label">{point.label}</text>;
        })}
      </svg>
    </div>
  );
}
