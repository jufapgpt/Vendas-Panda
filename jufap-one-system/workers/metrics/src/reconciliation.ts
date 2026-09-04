export interface ReconciliationInput {
  indicatorCode: string;
  referenceDate: string;
  scopeType: string;
  scopeId: string | null;
  baselineSource: string;
  baselineValue: number;
  candidateValue: number;
  toleranceAbsolute: number;
  toleranceRelative: number;
  details?: Record<string, unknown>;
}

export interface ReconciliationResult extends ReconciliationInput {
  absoluteDifference: number;
  relativeDifference: number | null;
  status: "matched" | "within_tolerance" | "divergent";
}

export function reconcile(input: ReconciliationInput): ReconciliationResult {
  const absoluteDifference = input.candidateValue - input.baselineValue;
  const relativeDifference = input.baselineValue === 0
    ? null
    : absoluteDifference / Math.abs(input.baselineValue);
  const absoluteMatch = Math.abs(absoluteDifference) === 0;
  const withinAbsolute = Math.abs(absoluteDifference) <= input.toleranceAbsolute;
  const withinRelative = relativeDifference !== null
    && Math.abs(relativeDifference) <= input.toleranceRelative;
  const status = absoluteMatch
    ? "matched"
    : withinAbsolute || withinRelative
      ? "within_tolerance"
      : "divergent";

  return {
    ...input,
    absoluteDifference,
    relativeDifference,
    status,
  };
}
