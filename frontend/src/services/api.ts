import type { SpotifyArtist, SpotifyTrack, GenreCount, UserProfile } from '../types/spotify';

const BACKEND_URL = 'http://127.0.0.1:3000';

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
    window.location.assign(`${BACKEND_URL}/auth/login`);
  },

  getMe() {
    return request<UserProfile>('/user/me');
  },

  getTopArtists() {
    return request<SpotifyArtist[]>('/dashboard/top/artists');
  },

  getTopTracks() {
    return request<SpotifyTrack[]>('/dashboard/top/tracks');
  },

  getTopGenres() {
    return request<GenreCount[]>('/dashboard/top/genres');
  },
};
