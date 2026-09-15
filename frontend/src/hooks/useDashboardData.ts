import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TimeRange } from '../services/api';
import type { SpotifyArtist, SpotifyTrack, GenreCount } from '../types/spotify';

interface DashboardData {
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  genres: GenreCount[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData(timeRange: TimeRange = 'medium_term'): DashboardData {
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [genres, setGenres] = useState<GenreCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [timeRange]);

  return { artists, tracks, genres, loading, error };
}
