import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TimeRange } from '../services/api';
import type { SpotifyArtist, SpotifyTrack, GenreCount } from '../types/spotify';
import { useDemo } from '../demo/context';

interface DashboardData {
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  genres: GenreCount[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData(timeRange: TimeRange = 'medium_term'): DashboardData {
  const { profile } = useDemo();
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [genres, setGenres] = useState<GenreCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Demo mode is served from the captured file below, with no request at all.
    if (profile) return;

    let cancelled = false;
    setLoading(true);

    async function fetchAll() {
      try {
        const [artistsData, tracksData, genresData] = await Promise.all([
          api.getTopArtists(timeRange),
          api.getTopTracks(timeRange),
          api.getTopGenres(timeRange),
        ]);
        if (cancelled) return;
        setArtists(artistsData);
        setTracks(tracksData);
        setGenres(genresData);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [timeRange, profile]);

  // The three captured periods stand in for the three endpoints, so the time
  // range filter keeps working exactly as it does against the live API.
  if (profile) {
    const term = profile.terms[timeRange] ?? profile.terms.medium_term;
    return {
      artists: term.artists,
      tracks: term.tracks,
      genres: term.genres,
      loading: false,
      error: null,
    };
  }

  return { artists, tracks, genres, loading, error };
}
