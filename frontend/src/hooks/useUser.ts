import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { UserProfile } from '../types/spotify';
import { useDemo } from '../demo/context';

export function useUser() {
  const { profile } = useDemo();
  const [user, setUser] = useState<UserProfile | null>(null);

  // Memoised: Share.tsx keys a canvas render off this object's identity.
  const demoUser = useMemo<UserProfile | null>(
    () =>
      profile && {
        displayName: profile.user.displayName,
        email: profile.user.email,
        avatarUrl: profile.user.avatarUrl ?? undefined,
      },
    [profile],
  );

  useEffect(() => {
    // Demo mode shows the fictional identity from the captured file.
    if (profile) return;

    let cancelled = false;
    api
      .getMe()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        /* the 401 path already redirects to the login screen */
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  return demoUser ?? user;
}
