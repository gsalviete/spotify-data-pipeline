import type { TimeRange } from '../services/api';

export const timeRangeOptions: { key: TimeRange; label: string }[] = [
  { key: 'short_term', label: '4 semanas' },
  { key: 'medium_term', label: '6 meses' },
  { key: 'long_term', label: 'Todo período' },
];

export function timeRangeLabel(range: TimeRange) {
  return timeRangeOptions.find((o) => o.key === range)?.label ?? '';
}
