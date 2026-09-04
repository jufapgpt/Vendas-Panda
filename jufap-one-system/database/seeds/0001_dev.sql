BEGIN;

INSERT INTO dim_company (code, name)
VALUES ('JUFAP', 'Grupo JUFAP')
ON CONFLICT (code) DO NOTHING;

INSERT INTO dim_region (code, name, state_code)
VALUES
  ('TPR', 'Paraná', 'PR'),
  ('TSP', 'São Paulo', 'SP')
ON CONFLICT (code) DO NOTHING;

INSERT INTO dim_indicator (
  code, version, label, domain, operation, unit, direction, description, canonical_formula, lifecycle
)
VALUES
  ('TIM_REVENUE', 1, 'Faturamento TIM', 'commercial', 'TIM', 'currency', 'higher_is_better', 'Faturamento TIM elegível.', 'SUM(f_faturamento_tim[valor_elegivel])', 'draft'),
  ('POST_TOTAL', 1, 'Pós Total', 'commercial', 'TIM', 'count', 'higher_is_better', 'Pós Pago mais Controle elegíveis.', 'POST_PAID + CONTROL', 'draft'),
  ('FINANCIAL', 1, 'Financeiro', 'financial', 'TIM', 'currency', 'higher_is_better', 'Resultado financeiro TIM elegível.', 'SUM(f_financeiro_tim[valor_elegivel])', 'draft'),
  ('DATA_QUALITY', 1, 'Qualidade dos dados', 'quality', 'group', 'percent', 'higher_is_better', 'Registros válidos sobre recebidos.', 'VALID_RECORDS / RECEIVED_RECORDS', 'draft')
ON CONFLICT (code, version) DO NOTHING;

INSERT INTO dim_source (code, name, domain, operation, expected_grain, frequency, status)
VALUES
  ('BASE_DATASYS', 'Base Datasys', 'commercial', 'TIM', 'uma ativação ou status por linha', 'intraday', 'pending_connection'),
  ('BASE_SALES', 'Base de vendas', 'commercial', 'TIM', 'um pedido ou item por linha', 'intraday', 'pending_connection'),
  ('STORE_UNIFIED_AUX', 'Auxiliar unificada para lojas', 'shared', 'TIM', 'uma loja e vigência por linha', 'daily', 'pending_connection')
ON CONFLICT (code) DO NOTHING;

COMMIT;
