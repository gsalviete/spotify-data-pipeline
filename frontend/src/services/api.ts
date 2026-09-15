import type { SpotifyArtist, SpotifyTrack, GenreCount, UserProfile } from '../types/spotify';

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

// Everything is same-origin: in dev the vite proxy forwards '/api' to the
// backend, in production the vercel rewrite forwards it to the deployed one.
// So this is a relative prefix, not an absolute URL. An empty or unset variable
// falls back to '/api', and a trailing slash is dropped to avoid '//' in paths.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

async function request<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
  });

  if (res.status === 401) {
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  login() {
    // full page navigation: the OAuth redirect needs a real document request
    window.location.assign(`${API_BASE_URL}/auth/login`);
  },

  getMe() {
    return request<UserProfile>(`${API_BASE_URL}/user/me`);
  },

  getTopArtists(timeRange: TimeRange = 'medium_term') {
    return request<SpotifyArtist[]>(`${API_BASE_URL}/dashboard/top/artists?time_range=${timeRange}`);
  },

  getTopTracks(timeRange: TimeRange = 'medium_term') {
    return request<SpotifyTrack[]>(`${API_BASE_URL}/dashboard/top/tracks?time_range=${timeRange}`);
  },

  getTopGenres(timeRange: TimeRange = 'medium_term') {
    return request<GenreCount[]>(`${API_BASE_URL}/dashboard/top/genres?time_range=${timeRange}`);
  },

  getRecentlyPlayed() {
    return request<any[]>(`${API_BASE_URL}/dashboard/recently-played`);
  },

  async chat(basedOn: string[], message: string) {
    const res = await fetch(`${API_BASE_URL}/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ basedOn, message }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{
      explanation: string;
      items: {
        id: string;
        name: string;
        type: 'track' | 'artist' | 'album';
        imageUrl: string;
        spotifyUrl: string;
        artist?: string;
      }[];
    }>;
  },

  async logout() {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/';
  },
};
