import type { SpotifyArtist, SpotifyTrack, GenreCount, UserProfile } from '../types/spotify';

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

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
    window.location.assign('http://127.0.0.1:3000/auth/login');
  },

  getMe() {
    return request<UserProfile>('/api/user/me');
  },

  getTopArtists(timeRange: TimeRange = 'medium_term') {
    return request<SpotifyArtist[]>(`/api/dashboard/top/artists?time_range=${timeRange}`);
  },

  getTopTracks(timeRange: TimeRange = 'medium_term') {
    return request<SpotifyTrack[]>(`/api/dashboard/top/tracks?time_range=${timeRange}`);
  },

  getTopGenres(timeRange: TimeRange = 'medium_term') {
    return request<GenreCount[]>(`/api/dashboard/top/genres?time_range=${timeRange}`);
  },

  getRecentlyPlayed() {
    return request<any[]>('/api/dashboard/recently-played');
  },

  async chat(basedOn: string[], message: string) {
    const res = await fetch('/api/chatbot', {
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
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/';
  },
};
