import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SpotifyArtist, SpotifyTrack, GenreCount, UserProfile } from '../types/spotify';

interface DashboardData {
  user: UserProfile | null;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  genres: GenreCount[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [genres, setGenres] = useState<GenreCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [userData, artistsData, tracksData, genresData] = await Promise.all([
          api.getMe(),
          api.getTopArtists(),
          api.getTopTracks(),
          api.getTopGenres(),
        ]);
        setUser(userData);
        setArtists(artistsData);
        setTracks(tracksData);
        setGenres(genresData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { user, artists, tracks, genres, loading, error };
}
