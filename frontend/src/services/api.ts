import type { SpotifyArtist, SpotifyTrack, GenreCount, UserProfile } from '../types/spotify';

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

  getTopArtists() {
    return request<SpotifyArtist[]>('/api/dashboard/top/artists');
  },

  getTopTracks() {
    return request<SpotifyTrack[]>('/api/dashboard/top/tracks');
  },

  getTopGenres() {
    return request<GenreCount[]>('/api/dashboard/top/genres');
  },
};
