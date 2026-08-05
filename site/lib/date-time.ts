const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

function timestampWithZone(value: string) {
  const normalized = value.trim().replace(" ", "T");
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;
}

export function formatBrasiliaDateTime(value: string) {
  return new Date(timestampWithZone(value)).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BRASILIA_TIME_ZONE,
  });
}
