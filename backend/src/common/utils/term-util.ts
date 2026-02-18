 export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

 const VALID_RANGES: TimeRange[] = ['short_term', 'medium_term', 'long_term']
 export function resolveTimeRange(timeRange?: string) : TimeRange{
    return VALID_RANGES.includes(timeRange as TimeRange)
        ? (timeRange as TimeRange)
        : 'medium_term'
 }