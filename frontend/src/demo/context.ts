import { createContext, useContext } from 'react';
import type { DemoProfile } from './types';

export interface DemoState {
  /** True while the captured dataset is standing in for the API. */
  demo: boolean;
  /** The profile being shown, or null outside demo mode. */
  profile: DemoProfile | null;
  profiles: DemoProfile[];
  enterDemo: () => Promise<void>;
  exitDemo: () => void;
  selectProfile: (id: string) => void;
}

export const DemoContext = createContext<DemoState | null>(null);

export function useDemo(): DemoState {
  const state = useContext(DemoContext);
  if (!state) throw new Error('useDemo must be used inside <DemoProvider>');
  return state;
}
