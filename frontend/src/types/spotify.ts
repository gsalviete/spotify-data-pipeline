export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  followers: { total: number };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  album: SpotifyAlbum;
  artists: { id: string; name: string }[];
  external_urls: { spotify: string };
  preview_url: string | null;
}

export interface GenreCount {
  genre: string;
  count: number;
}

export interface RecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

export interface UserProfile {
  email: string;
  avatarUrl?: string;
  displayName?: string;
}
