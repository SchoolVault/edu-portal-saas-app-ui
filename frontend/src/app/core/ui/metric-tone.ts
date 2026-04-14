/**
 * Shared semantic bands for parent (and future) KPI tiles.
 * Thresholds align with QA: red &lt;50%, orange 50–70%, green &gt;70%.
 */
export type MetricSemanticTone = 'danger' | 'warn' | 'ok' | 'neutral';

export function toneClassForPercent(value: number | null | undefined): MetricSemanticTone {
  if (value == null || Number.isNaN(value)) {
    return 'neutral';
  }
  if (value < 50) {
    return 'danger';
  }
  if (value < 70) {
    return 'warn';
  }
  return 'ok';
}

/** Higher counts are better (e.g. days present in range). */
export function toneClassForCountHigherBetter(value: number | null | undefined, maxInRange: number | null | undefined): MetricSemanticTone {
  if (value == null || maxInRange == null || maxInRange <= 0) {
    return 'neutral';
  }
  const ratio = value / maxInRange;
  if (ratio < 0.5) {
    return 'danger';
  }
  if (ratio < 0.7) {
    return 'warn';
  }
  return 'ok';
}

/** Higher currency amounts are worse (fees pending). */
export function toneClassForAmountHigherWorse(amount: number | null | undefined): MetricSemanticTone {
  if (amount == null || amount <= 0) {
    return 'ok';
  }
  if (amount >= 25_000) {
    return 'danger';
  }
  if (amount >= 10_000) {
    return 'warn';
  }
  return 'neutral';
}

export function cssClassForTone(tone: MetricSemanticTone, prefix = 'metric-tone'): string {
  return `${prefix} ${prefix}--${tone}`;
}
