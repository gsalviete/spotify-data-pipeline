import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { RecentlyPlayedItem } from '../types/spotify';
import PageShell, { LoadingState, ErrorState } from '../components/Shell';
import { useUser } from '../hooks/useUser';
import './RecentlyPlayed.css';

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

export default function RecentlyPlayed() {
  const user = useUser();
  const [items, setItems] = useState<RecentlyPlayedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRecentlyPlayed()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <PageShell title="Tocadas Recentemente" subtitle="Suas últimas músicas ouvidas" user={user}>
      <div className="recent-list">
        {items.map((item, index) => (
          <motion.a
            key={`${item.track.id}-${item.played_at}`}
            href={item.track.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="recent-card"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.025, duration: 0.35 }}
          >
            <div className="recent-cover-wrapper">
              {item.track.album.images[0] ? (
                <img
                  src={item.track.album.images[item.track.album.images.length > 1 ? 1 : 0].url}
                  alt={item.track.album.name}
                  className="recent-cover"
                />
              ) : (
                <div className="recent-cover recent-cover--placeholder" />
              )}
              <div className="recent-play-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
            <div className="recent-info">
              <span className="recent-name">{item.track.name}</span>
              <span className="recent-artist">
                {item.track.artists.map((a) => a.name).join(', ')}
              </span>
            </div>
            <span className="recent-duration">{formatDuration(item.track.duration_ms)}</span>
            <span className="recent-time">{timeAgo(item.played_at)}</span>
          </motion.a>
        ))}
      </div>
    </PageShell>
  );
}
