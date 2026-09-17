import type { DemoProfile } from './types';

// The capture script writes one json per profile into ../demo-data. Globbing
// them means adding or removing a profile needs no code change.
//
// Deliberately not `eager`: the captured payload is close to a megabyte, and
// bundling it into the main chunk would make every logged-in user download a
// dataset they never see. Each file becomes its own chunk, fetched only when
// someone actually opens the demo.
const loaders = import.meta.glob('../demo-data/*.json', {
  import: 'default',
}) as Record<string, () => Promise<DemoProfile>>;

/** Known without loading anything — enough to decide whether to offer the demo. */
export const demoProfileCount = Object.keys(loaders).length;

let pending: Promise<DemoProfile[]> | null = null;

/** Loads every captured profile once and caches the result. */
export function loadDemoProfiles(): Promise<DemoProfile[]> {
  pending ??= Promise.all(
    Object.keys(loaders)
      .sort()
      .map((path) => loaders[path]()),
  );
  return pending;
}
