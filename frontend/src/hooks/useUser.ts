import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { UserProfile } from '../types/spotify';

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
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
  }, []);

  return user;
}
