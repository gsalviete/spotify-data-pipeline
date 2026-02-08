import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
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

const ACCENT_COLORS = [
  '#1db954', '#1ed760', '#22c55e', '#4ade80', '#86efac',
  '#a7f3d0', '#1db954', '#1ed760', '#22c55e', '#4ade80',
];

export default function TopTracks({ tracks }: Props) {
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  const chartData = tracks.slice(0, 10).map((t) => ({
    name: t.name.length > 18 ? t.name.slice(0, 18) + '...' : t.name,
    fullName: t.name,
    popularity: t.popularity,
    duration: formatDuration(t.duration_ms),
  }));

  return (
    <div className="top-tracks">
      <div className="top-tracks-chart-section">
        <h3 className="section-title">Popularidade das faixas</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
              barCategoryGap="18%"
            >
              <XAxis
                type="number"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{
                  background: 'rgba(24,24,24,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  fontFamily: 'Outfit',
                }}
                labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#1db954' }}
                formatter={(value) => [`${value}`]}
              />
              <Bar dataKey="popularity" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="top-tracks-list">
        {tracks.map((track, index) => (
          <motion.a
            key={track.id}
            href={track.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className={`track-card ${hoveredTrack === track.id ? 'track-card--hover' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
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
            <span className="track-album">{track.album.name}</span>
            <span className="track-duration">{formatDuration(track.duration_ms)}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
