import type { TimeRange } from '../services/api';
import type {
  GenreCount,
  RecentlyPlayedItem,
  SpotifyArtist,
  SpotifyTrack,
} from '../types/spotify';

/** Shape written by backend/scripts/capture-demo-data.ts. */

export interface DemoChatItem {
  id: string;
  name: string;
  type: 'track' | 'artist' | 'album';
  imageUrl: string;
  spotifyUrl: string;
  artist?: string;
}

export interface DemoChat {
  basedOn: string[];
  message: string;
  response: { explanation: string; items: DemoChatItem[] };
}

export interface DemoTerm {
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  genres: GenreCount[];
}

export interface DemoProfile {
  id: string;
  /** Fictional stand-in: the capture script never writes the real identity. */
  user: { displayName: string; email: string; avatarUrl: string | null };
  terms: Record<TimeRange, DemoTerm>;
  recentlyPlayed: RecentlyPlayedItem[];
  /** Null when the capture ran while the chat API was unavailable. */
  chat: DemoChat | null;
}
