import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SpotifyTrack } from '../types/spotify';
import './TopTracks.css';

interface Props {
  tracks: SpotifyTrack[];
}

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function TopTracks({ tracks }: Props) {
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const top10 = tracks.slice(0, 10);

  return (
    <div className="top-tracks">
      <div className="top-tracks-list">
        {top10.map((track, index) => (
          <motion.a
            key={track.id}
            href={track.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className={`track-card ${hoveredTrack === track.id ? 'track-card--hover' : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.35 }}
            onHoverStart={() => setHoveredTrack(track.id)}
            onHoverEnd={() => setHoveredTrack(null)}
          >
            <div className="track-rank">#{index + 1}</div>
            <div className="track-cover-wrapper">
              {track.album.images[0] ? (
                <img
                  src={track.album.images[track.album.images.length > 1 ? 1 : 0].url}
                  alt={track.album.name}
                  className="track-cover"
                />
              ) : (
                <div className="track-cover track-cover--placeholder" />
              )}
              <div className="track-play-overlay">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
            <div className="track-info">
              <span className="track-name">{track.name}</span>
              <span className="track-artist">
                {track.artists.map((a) => a.name).join(', ')}
              </span>
            </div>
            <span className="track-duration">{formatDuration(track.duration_ms)}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
