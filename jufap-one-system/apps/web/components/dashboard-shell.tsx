"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ActionPlan,
  DashboardFilters,
  DashboardOverviewResponse,
  MetricSnapshot,
  Period,
  StoreSummary,
} from "@jufap-one/core";
import { fetchOverview, updateAction } from "../lib/api";
import { fallbackResponse } from "../lib/fallback";
import { compactCurrency, formatDateTime, formatPercent, formatValue } from "../lib/format";
import { LineChart } from "./line-chart";
import { MetricCard } from "./metric-card";

const navigation = [
  ["overview", "Visão geral", "◫"],
  ["results", "Resultado", "◉"],
  ["stores", "Lojas", "⌂"],
  ["composition", "Composição", "◇"],
  ["rhythm", "Ritmo", "⌁"],
  ["up", "UP", "↗"],
  ["quality", "Qualidade", "✓"],
  ["actions", "Plano de ação", "◎"],
  ["brief", "JUFAP Brief", "✦"],
] as const;

const periodOptions: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "month", label: "Mês" },
  { value: "closing", label: "Fechamento" },
  { value: "custom", label: "Personalizado" },
];

const classificationLabels: Record<StoreSummary["classification"], string> = {
  highlight: "Destaque",
  recoverable: "Recuperável",
  attention: "Em atenção",
  critical: "Crítica",
  incomplete_data: "Dados incompletos",
};

const actionStatusLabels: Record<ActionPlan["status"], string> = {
  pending: "Pendente",
  in_progress: "Em atuação",
  blocked: "Bloqueada",
  done: "Concluída",
};

function metricStatus(metric: MetricSnapshot): string {
  if (metric.severity === "positive") return "positivo";
  if (metric.severity === "critical") return "crítico";
  if (metric.severity === "attention") return "atenção";
  return "neutro";
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="section-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

function StoreDrawer({ store, onClose }: { store: StoreSummary; onClose: () => void }) {
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="store-drawer" role="dialog" aria-modal="true" aria-label={`Dossiê da loja ${store.name}`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Fechar dossiê">×</button>
        <span className="eyebrow">Dossiê da loja</span>
        <h2>{store.name}</h2>
        <p className="drawer-subtitle">{store.code} · {store.regional} · {store.coordinator}</p>
        <div className={`store-classification classification-${store.classification}`}>{classificationLabels[store.classification]}</div>
        <div className="drawer-kpis">
          <div><span>Saúde da loja</span><strong>{store.healthScore}</strong></div>
          <div><span>Tendência</span><strong>{formatPercent(store.trendAchievement)}</strong></div>
          <div><span>GAP projetado</span><strong>{compactCurrency(store.gap)}</strong></div>
          <div><span>Dias zerados</span><strong>{store.zeroDays}</strong></div>
          <div><span>Potencial recuperável</span><strong>{compactCurrency(store.recoverablePotential)}</strong></div>
          <div><span>Qualidade dos dados</span><strong>{formatPercent(store.qualityScore)}</strong></div>
        </div>
        <div className="drawer-callout">
          <span>Principal ofensor</span>
          <strong>{store.mainOffender}</strong>
          <p>A etapa de conexão habilitará histórico, vendedores, mix, evidências e abertura contextual do Power BI.</p>
        </div>
        <div className="drawer-tabs">
          <button className="active">Resumo</button>
          <button>Comercial</button>
          <button>Qualidade</button>
          <button>Ações</button>
        </div>
        <div className="drawer-placeholder">
          <strong>Visão integrada preparada</strong>
          <p>O dossiê reunirá metas, ritmo, composição, UP, divergências e plano de ação da unidade em uma única jornada.</p>
        </div>
      </aside>
    </div>
  );
}

export function DashboardShell() {
  const [filters, setFilters] = useState<DashboardFilters>(fallbackResponse.data.filters);
  const [response, setResponse] = useState<DashboardOverviewResponse>(fallbackResponse);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreSummary | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rhythmMode, setRhythmMode] = useState("Dia");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchOverview(filters, controller.signal)
      .then((result) => {
        setResponse(result.response);
        setWarning(result.warning);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setWarning("Não foi possível atualizar a visão.");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [filters]);

  const data = response.data;
  const allMetrics = useMemo(() => [...data.kpis, ...data.indicatorStrip], [data.kpis, data.indicatorStrip]);
  const selectedMetric = allMetrics.find((metric) => metric.code === filters.indicator) ?? allMetrics[0];
  const stores = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return data.stores;
    return data.stores.filter((store) =>
      [store.name, store.code, store.regional, store.coordinator, store.mainOffender]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [data.stores, search]);

  const classificationCounts = useMemo(() => {
    return data.stores.reduce<Record<StoreSummary["classification"], number>>(
      (accumulator, store) => {
        accumulator[store.classification] += 1;
        return accumulator;
      },
      { highlight: 0, recoverable: 0, attention: 0, critical: 0, incomplete_data: 0 },
    );
  }, [data.stores]);

  function setPeriod(period: Period) {
    setFilters((current) => ({ ...current, period }));
  }

  function setScope(scopeType: DashboardFilters["scopeType"], scopeId?: string) {
    setFilters((current) => {
      const next: DashboardFilters = { ...current, scopeType };
      if (scopeId) next.scopeId = scopeId;
      else delete next.scopeId;
      return next;
    });
  }

  async function changeActionStatus(action: ActionPlan, status: ActionPlan["status"]) {
    setActionMessage(null);
    try {
      await updateAction(action.id, status);
      setResponse((current) => ({
        ...current,
        data: {
          ...current.data,
          actions: current.data.actions.map((item) => item.id === action.id ? { ...item, status } : item),
        },
      }));
      setActionMessage("Ação atualizada com sucesso.");
    } catch {
      setActionMessage("A API ainda não está disponível; a alteração não foi persistida.");
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <a href="#overview" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><i /><i /><i /></span>
          <span><strong>JUFAP One</strong><small>Executive Intelligence</small></span>
        </a>
        <span className="sidebar-caption">Navegação</span>
        <nav>
          {navigation.map(([id, label, icon]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
              {id === "quality" && data.quality.pendingRecords > 0 ? <b>{data.quality.pendingRecords}</b> : null}
              {id === "actions" && data.actions.length > 0 ? <b>{data.actions.filter((action) => action.status !== "done").length}</b> : null}
            </a>
          ))}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">DJ</div>
          <div><strong>Diretoria JUFAP</strong><span>Visão de grupo</span></div>
          <button aria-label="Opções do perfil">⋯</button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu">☰</button>
          <div className="period-switch" aria-label="Período">
            {periodOptions.map((option) => (
              <button key={option.value} className={filters.period === option.value ? "active" : ""} onClick={() => setPeriod(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="topbar-filters">
            <select value={filters.scopeType === "regional" ? filters.scopeId ?? "all" : "all"} onChange={(event) => event.target.value === "all" ? setScope("group") : setScope("regional", event.target.value)} aria-label="Regional">
              <option value="all">Todas as regionais</option>
              <option value="TPR">TPR</option>
              <option value="TSP">TSP</option>
            </select>
            <select value={filters.scopeType === "store" ? filters.scopeId ?? "all" : "all"} onChange={(event) => event.target.value === "all" ? setScope("group") : setScope("store", event.target.value)} aria-label="Loja">
              <option value="all">Todas as lojas</option>
              {data.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" title="Alertas">◉ <span>{data.quality.pendingRecords}</span></button>
            <button className="primary-button" onClick={() => window.print()}>Exportar</button>
          </div>
        </header>

        <main>
          <section id="overview" className="hero-section">
            <div className="hero-heading">
              <div>
                <span className="eyebrow">Pulso executivo</span>
                <h1>Bom dia, Diretoria.</h1>
                <p>{data.scopeLabel} · Atualizado em {formatDateTime(data.asOf)}</p>
              </div>
              <div className="data-status">
                <span className={`quality-dot quality-${data.quality.state}`} />
                <div><strong>Qualidade {formatPercent(data.quality.score)}</strong><small>{data.quality.message}</small></div>
              </div>
            </div>

            {warning ? <div className="system-banner">{warning}</div> : null}
            {response.meta.dataMode === "mock" ? <div className="demo-banner"><strong>Estrutura pronta.</strong> Os números são demonstrativos até a conexão das fontes oficiais do OneDrive.</div> : null}

            <div className={`metric-grid ${loading ? "is-loading" : ""}`}>
              {data.kpis.map((metric) => <MetricCard key={metric.code} metric={metric} />)}
            </div>

            <div className="indicator-strip">
              {data.indicatorStrip.map((metric) => (
                <button key={metric.code} className={`indicator-pill severity-${metric.severity}`} onClick={() => setFilters((current) => ({ ...current, indicator: metric.code }))}>
                  <span>{metric.label}</span>
                  <strong>{formatPercent(metric.achievement)}</strong>
                  <small>{metricStatus(metric)}</small>
                </button>
              ))}
            </div>

            <div className="narrative-grid">
              <article className="panel narrative-panel">
                <span className="panel-kicker">Leitura do período</span>
                <h2>{data.narrative.headline}</h2>
                <p>{data.narrative.summary}</p>
                <div className="story-grid">
                  <div className="story-card story-positive"><span>Principal motor</span><strong>{data.narrative.positiveDriver}</strong></div>
                  <div className="story-card story-risk"><span>Maior risco</span><strong>{data.narrative.mainRisk}</strong></div>
                  <div className="story-card story-action"><span>Ação recomendada</span><strong>{data.narrative.recommendedAction}</strong></div>
                </div>
              </article>
              <aside className="panel priorities-panel">
                <span className="panel-kicker">Prioridades do dia</span>
                <h3>Onde agir primeiro</h3>
                {data.actions.slice(0, 3).map((action, index) => (
                  <div className="priority-row" key={action.id}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <div><strong>{action.title}</strong><span>{compactCurrency(action.impact)} · {action.owner}</span></div>
                  </div>
                ))}
              </aside>
            </div>
          </section>

          <section id="results">
            <SectionHeader eyebrow="Resultado" title="O que explica o atingimento e o GAP?" description="Uma única leitura para Meta, Realizado, Tendência, ritmo e unidades responsáveis." />
            <div className="metric-tabs">
              {allMetrics.filter((metric) => metric.code !== "STORES_ATTENTION").map((metric) => (
                <button key={metric.code} className={selectedMetric?.code === metric.code ? "active" : ""} onClick={() => setFilters((current) => ({ ...current, indicator: metric.code }))}>{metric.label}</button>
              ))}
            </div>
            {selectedMetric ? (
              <div className="result-layout">
                <article className="panel result-panel">
                  <div className="result-heading">
                    <div><span className="panel-kicker">Indicador selecionado</span><h3>{selectedMetric.label}</h3></div>
                    <span className={`status-tag severity-${selectedMetric.severity}`}>{metricStatus(selectedMetric)}</span>
                  </div>
                  <div className="result-summary">
                    <div><span>Meta</span><strong>{formatValue(selectedMetric.goal, selectedMetric.unit)}</strong></div>
                    <div><span>Realizado</span><strong>{formatValue(selectedMetric.value, selectedMetric.unit)}</strong></div>
                    <div><span>Tendência</span><strong>{formatValue(selectedMetric.trend, selectedMetric.unit)}</strong></div>
                    <div><span>GAP projetado</span><strong>{formatValue(selectedMetric.gap, selectedMetric.unit)}</strong></div>
                    <div><span>Necessário/dia</span><strong>{formatValue(selectedMetric.neededPerDay, selectedMetric.unit)}</strong></div>
                  </div>
                  <LineChart points={data.rhythm} />
                </article>
                <aside className="panel driver-panel">
                  <span className="panel-kicker">Diagnóstico</span>
                  <h3>Lojas que mais explicam o desvio</h3>
                  {data.stores.slice().sort((a, b) => a.gap - b.gap).slice(0, 5).map((store) => (
                    <button className="driver-row" key={store.id} onClick={() => setSelectedStore(store)}>
                      <div><strong>{store.name}</strong><span>{store.mainOffender}</span></div>
                      <b>{compactCurrency(store.gap)}</b>
                    </button>
                  ))}
                  <div className="impact-box"><strong>{compactCurrency(data.stores.reduce((sum, store) => sum + store.recoverablePotential, 0))}</strong><span>potencial recuperável mapeado nas lojas exibidas</span></div>
                </aside>
              </div>
            ) : null}
          </section>

          <section id="stores">
            <SectionHeader eyebrow="Rede de lojas" title="Quais unidades merecem atenção agora?" description="Classificação por resultado, tendência, recorrência de zerados, qualidade e potencial de recuperação." />
            <div className="classification-grid">
              {(Object.keys(classificationCounts) as StoreSummary["classification"][]).map((classification) => (
                <div key={classification} className={`classification-card classification-${classification}`}>
                  <span>{classificationLabels[classification]}</span><strong>{classificationCounts[classification]}</strong>
                </div>
              ))}
            </div>
            <article className="panel store-panel">
              <div className="table-toolbar">
                <div><span className="panel-kicker">Dossiê executivo</span><h3>Saúde e ofensores por loja</h3></div>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar loja, regional ou ofensor" aria-label="Buscar lojas" />
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Loja</th><th>Saúde</th><th>Classificação</th><th>Tendência</th><th>GAP</th><th>Zerados</th><th>Principal ofensor</th><th>Qualidade</th></tr></thead>
                  <tbody>
                    {stores.map((store) => (
                      <tr key={store.id} onClick={() => setSelectedStore(store)}>
                        <td><strong>{store.name}</strong><small>{store.regional} · {store.coordinator}</small></td>
                        <td><div className="health-cell"><span>{store.healthScore}</span><i><b style={{ width: `${store.healthScore}%` }} /></i></div></td>
                        <td><span className={`store-classification classification-${store.classification}`}>{classificationLabels[store.classification]}</span></td>
                        <td>{formatPercent(store.trendAchievement)}</td>
                        <td className={store.gap < 0 ? "negative" : "positive"}>{compactCurrency(store.gap)}</td>
                        <td>{store.zeroDays}</td>
                        <td>{store.mainOffender}</td>
                        <td>{formatPercent(store.qualityScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section id="composition">
            <SectionHeader eyebrow="Composição comercial" title="A venda está sendo construída com qualidade?" description="Mix, dependentes, acessórios, Pitzi e portabilidade explicam a qualidade do resultado além do volume." />
            <div className="composition-grid">
              {data.composition.map((item) => (
                <article className={`panel composition-card severity-${item.severity}`} key={item.code}>
                  <div><span>{item.label}</span><strong>{formatValue(item.value, item.unit)}</strong></div>
                  <b>{formatPercent(item.comparison)}</b>
                  <p>{item.explanation}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="rhythm">
            <SectionHeader eyebrow="Ritmo e histórico" title="Estamos acelerando no ritmo necessário?" description="Comparações coerentes por dia, dia da semana, semana, mês e ano anterior." />
            <article className="panel rhythm-panel">
              <div className="rhythm-toolbar">
                <div className="metric-tabs compact">{["Dia", "Dia da semana", "Semana", "Mês", "Ano anterior"].map((mode) => <button key={mode} className={rhythmMode === mode ? "active" : ""} onClick={() => setRhythmMode(mode)}>{mode}</button>)}</div>
                <span>Modo atual: <strong>{rhythmMode}</strong></span>
              </div>
              <LineChart points={data.rhythm} />
            </article>
          </section>

          <section id="up">
            <SectionHeader eyebrow="UP G e UP Z" title="Quanto do fluxo recebido chega válido ao resultado?" description="Recebimento, identificação, validação, duplicidade e consideração final em uma única cadeia auditável." />
            <article className="panel up-panel">
              <div className="up-flow">
                {data.upStages.map((stage, index) => (
                  <div className={`up-stage severity-${stage.severity}`} key={stage.code}>
                    <span>{stage.label}</span><strong>{stage.value}</strong><small>{formatPercent(stage.percentage)}</small>{index < data.upStages.length - 1 ? <i>→</i> : null}
                  </div>
                ))}
              </div>
              <div className="up-insight"><strong>18 registros duplicados</strong><span>equivalem a 4,2% do volume recebido e permanecem separados do resultado até validação.</span></div>
            </article>
          </section>

          <section id="quality">
            <SectionHeader eyebrow="Central de qualidade" title="Podemos confiar integralmente nos números?" description="Pendências de identificação deixam de ser abas técnicas isoladas e passam a explicar confiança e impacto." />
            <div className="quality-layout">
              <article className="panel quality-score-card">
                <span className="panel-kicker">Selo de confiança</span>
                <strong>{formatPercent(data.quality.score)}</strong>
                <p>{data.quality.message}</p>
                <div><span>{data.quality.pendingRecords} pendências</span><span>{compactCurrency(data.quality.pendingValue)} sob análise</span></div>
              </article>
              <article className="panel issue-list">
                {data.qualityIssues.map((issue) => (
                  <div className="issue-row" key={issue.id}>
                    <span className={`issue-severity issue-${issue.severity}`} />
                    <div><strong>{issue.title}</strong><p>{issue.description}</p><small>{issue.owner} · {issue.status === "in_progress" ? "Em tratamento" : "Aberta"}</small></div>
                    <aside><b>{issue.count}</b><span>{compactCurrency(issue.financialImpact)}</span></aside>
                  </div>
                ))}
              </article>
            </div>
          </section>

          <section id="actions">
            <SectionHeader eyebrow="Plano de ação" title="O que precisa ser feito, por quem e até quando?" description="Cada ação permanece vinculada ao indicador, impacto, unidade, responsável, prazo e evidência que a originou." />
            {actionMessage ? <div className="system-banner">{actionMessage}</div> : null}
            <div className="action-grid">
              {data.actions.map((action) => (
                <article className={`panel action-card priority-${action.priority}`} key={action.id}>
                  <div className="action-heading"><span>{action.priority}</span><select value={action.status} onChange={(event) => changeActionStatus(action, event.target.value as ActionPlan["status"])}>{Object.entries(actionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                  <h3>{action.title}</h3><p>{action.description}</p>
                  <div className="action-meta"><span>Impacto <strong>{compactCurrency(action.impact)}</strong></span><span>Responsável <strong>{action.owner}</strong></span><span>Prazo <strong>{formatDateTime(action.dueAt)}</strong></span></div>
                </article>
              ))}
            </div>
          </section>

          <section id="brief">
            <SectionHeader eyebrow="JUFAP Brief" title="A leitura gerencial pronta para chegar por e-mail" description="O mesmo modelo e as mesmas métricas do sistema, personalizados conforme o perfil e o escopo do usuário." />
            <article className="brief-card">
              <div className="brief-masthead"><span>JUFAP</span><strong>BRIEF</strong><small>04 SET 2026 · EDIÇÃO EXECUTIVA</small></div>
              <div className="brief-content"><span className="eyebrow">A manchete do período</span><h2>{data.narrative.headline}</h2><p>{data.narrative.summary}</p><div className="brief-kpis">{data.kpis.slice(0, 3).map((metric) => <div key={metric.code}><span>{metric.label}</span><strong>{formatValue(metric.value, metric.unit)}</strong><small>{formatPercent(metric.comparison)} no comparável</small></div>)}</div></div>
              <aside><span>Três movimentos</span><ol><li>{data.narrative.positiveDriver}</li><li>{data.narrative.mainRisk}</li><li>{data.narrative.recommendedAction}</li></ol><button className="primary-button">Abrir visão completa</button></aside>
            </article>
          </section>
        </main>
      </div>
      {menuOpen ? <button className="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" /> : null}
      {selectedStore ? <StoreDrawer store={selectedStore} onClose={() => setSelectedStore(null)} /> : null}
    </div>
  );
}
