import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DemoContext } from './context';
import { loadDemoProfiles } from './profiles';
import type { DemoProfile } from './types';
import { LoadingState } from '../components/Shell';

/**
 * Demo mode is runtime state rather than a build flag or a query param: an env
 * var would need a second deploy to show it, and a query param would have to be
 * threaded through every navigate() call and would leak into shared links. This
 * keeps it to one provider that only the data hooks consult.
 *
 * Persisted per tab so a reload inside the demo does not bounce back to login.
 */
const STORAGE_KEY = 'demo-profile';

function store(id: string | null) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing: the demo still works, it just won't survive a reload.
  }
}

function restore(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function DemoProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<DemoProfile[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  // A restored demo has to finish loading before anything renders, otherwise
  // the dashboard would fire the real requests during that gap.
  const [booting, setBooting] = useState(() => restore() !== null);

  /** An unknown id (a profile that was removed) falls back to the first one. */
  const apply = useCallback((loaded: DemoProfile[], id: string | null) => {
    const chosen = loaded.find((item) => item.id === id) ?? loaded[0] ?? null;
    setProfiles(loaded);
    setProfileId(chosen?.id ?? null);
    store(chosen?.id ?? null);
  }, []);

  useEffect(() => {
    if (!booting) return;

    let cancelled = false;
    const stored = restore();

    loadDemoProfiles()
      .then((loaded) => {
        if (!cancelled) apply(loaded, stored);
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [booting, apply]);

  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? null,
    [profiles, profileId],
  );

  const enterDemo = useCallback(async () => {
    apply(await loadDemoProfiles(), null);
  }, [apply]);

  const exitDemo = useCallback(() => {
    store(null);
    // A full reload, the same thing api.logout() does. Clearing the profile in
    // place would not be enough: react-router defers navigation in a transition,
    // so the dashboard would re-render once without a profile and the data hooks
    // would fire the real requests before the login screen took over.
    window.location.href = '/';
  }, []);

  const selectProfile = useCallback((id: string) => {
    setProfileId(id);
    store(id);
  }, []);

  const value = useMemo(
    () => ({
      demo: profile !== null,
      profile,
      profiles,
      enterDemo,
      exitDemo,
      selectProfile,
    }),
    [profile, profiles, enterDemo, exitDemo, selectProfile],
  );

  if (booting) return <LoadingState label="Carregando a demonstracao..." />;

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
