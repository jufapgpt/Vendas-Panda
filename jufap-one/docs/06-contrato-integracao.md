# Contrato de Integração — JUFAP One

Este contrato define como o frontend do JUFAP One deverá receber os dados do modelo semântico ou backend.

## 1. Contexto global

```json
{
  "context": {
    "period": {
      "type": "month",
      "start": "2026-09-01",
      "end": "2026-09-30",
      "asOf": "2026-09-03T08:32:00-03:00",
      "closed": false
    },
    "scope": {
      "profile": "DIRECTOR",
      "companyIds": ["JUFAP"],
      "regionalIds": ["TPR", "TSP"],
      "coordinatorIds": [],
      "storeIds": []
    }
  }
}
```

## 2. Pulso executivo

```json
{
  "executivePulse": {
    "headline": "Controle e Faturamento TIM concentram a oportunidade de recuperação",
    "metrics": [
      {
        "indicatorId": "FAT_TIM",
        "label": "Faturamento TIM",
        "unit": "BRL",
        "target": 430000,
        "actual": 358302.47,
        "actualPct": 0.833,
        "forecast": 406000,
        "forecastPct": 0.944,
        "projectedGap": -24000,
        "neededPerDay": 0,
        "status": "CRITICAL",
        "qualityPct": 0.994,
        "updatedAt": "2026-09-03T08:32:00-03:00",
        "source": "DATASYS"
      }
    ],
    "narrative": {
      "result": "...",
      "positiveDriver": "...",
      "pressure": "...",
      "concentration": "...",
      "recommendedAction": "...",
      "generatedBy": "RULE_ENGINE",
      "evidenceIds": ["FAT_TIM", "CONTROLE"]
    }
  }
}
```

## 3. Série temporal

```json
{
  "series": {
    "indicatorId": "FAT_TIM",
    "grain": "DAY",
    "points": [
      {
        "date": "2026-09-01",
        "actual": 10000,
        "targetAccumulated": 12000,
        "previousComparable": 9500,
        "dataStatus": "CONSOLIDATED"
      }
    ]
  }
}
```

## 4. Rede de lojas

```json
{
  "stores": [
    {
      "storeId": "TSP-CENTER-NORTE",
      "name": "CENTER NORTE",
      "regionalId": "TSP",
      "healthScore": 91,
      "classification": "HIGHLIGHT",
      "forecastPct": 1.086,
      "fatTimPct": 1.042,
      "mainOffender": null,
      "zeroDays": 0,
      "qualityPct": 0.995,
      "projectedGap": 12000,
      "recoverablePotential": 0,
      "openActionCount": 0
    }
  ]
}
```

Classificações permitidas:

- `HIGHLIGHT`;
- `RECOVERABLE`;
- `ATTENTION`;
- `CRITICAL`;
- `INCOMPLETE_DATA`.

## 5. Composição comercial

```json
{
  "composition": {
    "postpaid": 1541,
    "control": 2977,
    "postTotal": 4518,
    "dependents": {
      "count": 0,
      "attachRate": 0.71
    },
    "accessories": {
      "revenue": 164805.69,
      "target": 141600,
      "achievementPct": 1.163,
      "attachRate": 0.0
    },
    "pitzi": {
      "revenue": 539336.04,
      "target": 337000,
      "achievementPct": 1.60,
      "eligibleDevices": 0,
      "offers": 0,
      "sales": 828,
      "conversionPct": 0.0
    },
    "portability": {
      "requested": 787,
      "activated": 572,
      "pending": 215,
      "conversionPct": 0.789
    }
  }
}
```

Valores desconhecidos não devem ser preenchidos com zero. Usar `null` e informar `availabilityStatus`.

## 6. UP

```json
{
  "up": {
    "received": 1042,
    "identified": 1011,
    "validated": 984,
    "duplicates": 18,
    "includedInResult": 966,
    "validationPct": 0.944,
    "duplicatePct": 0.017,
    "pendingImpact": {
      "amount": null,
      "quantity": 45,
      "stores": 3
    }
  }
}
```

## 7. Qualidade

```json
{
  "dataQuality": {
    "reliabilityPct": 0.974,
    "status": "ATTENTION",
    "issues": [
      {
        "issueType": "DATASYS_IDENTIFICATION",
        "count": 9,
        "indicatorIds": ["REALIZADO", "TENDENCIA"],
        "amountImpact": null,
        "quantityImpact": 9,
        "oldestOpenedAt": "2026-09-01T10:00:00-03:00",
        "owner": "CONTROLADORIA",
        "slaStatus": "DUE_TODAY"
      }
    ],
    "sources": [
      {
        "sourceId": "DATASYS",
        "updatedAt": "2026-09-03T08:32:00-03:00",
        "expectedAt": "2026-09-03T09:00:00-03:00",
        "status": "UPDATED"
      }
    ]
  }
}
```

## 8. Plano de ação

```json
{
  "actions": [
    {
      "actionId": "ACT-2026-0001",
      "priority": "HIGH",
      "title": "Recuperar Controle em cinco lojas",
      "origin": {
        "indicatorId": "CONTROLE",
        "alertId": "ALT-2026-0012"
      },
      "scope": {
        "regionalId": "TSP",
        "storeIds": ["..."]
      },
      "expectedImpact": {
        "amount": 38000,
        "quantity": null
      },
      "owner": {
        "personId": "...",
        "name": "..."
      },
      "dueAt": "2026-09-03T18:00:00-03:00",
      "status": "IN_PROGRESS",
      "evidenceUrl": null,
      "createdAt": "2026-09-03T09:00:00-03:00"
    }
  ]
}
```

## 9. Estados obrigatórios de interface

Toda resposta deverá diferenciar:

- carregando;
- disponível;
- parcial;
- sem dados;
- sem permissão;
- erro de fonte;
- fonte atrasada;
- divergência relevante.

Nenhum zero poderá significar simultaneamente “sem produção”, “sem dado” e “erro”.

## 10. Regras de API

- datas em ISO 8601;
- moeda em número decimal, sem texto formatado;
- percentuais em escala 0–1;
- IDs estáveis;
- `null` para informação não disponível;
- versão do contrato no cabeçalho;
- filtros de segurança aplicados no servidor;
- resposta registra `asOf` e `source`;
- narrativa registra as evidências usadas;
- paginação para detalhes;
- cache por perfil e escopo;
- trilha de auditoria para ações.

## 11. Endpoints sugeridos

```text
GET  /api/v1/context
GET  /api/v1/executive-pulse
GET  /api/v1/indicators/{indicatorId}
GET  /api/v1/indicators/{indicatorId}/series
GET  /api/v1/stores
GET  /api/v1/stores/{storeId}
GET  /api/v1/composition
GET  /api/v1/up
GET  /api/v1/data-quality
GET  /api/v1/actions
POST /api/v1/actions
PATCH /api/v1/actions/{actionId}
GET  /api/v1/brief
```

Os parâmetros globais devem ser consistentes:

```text
startDate, endDate, companyId, regionalId, coordinatorId, storeId, indicatorId
```
