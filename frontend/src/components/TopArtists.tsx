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
import type { SpotifyArtist } from '../types/spotify';
import './TopArtists.css';

interface Props {
  artists: SpotifyArtist[];
}

const GREENS = [
  '#1db954', '#1ed760', '#4ade80', '#22c55e', '#16a34a',
  '#15803d', '#1db954', '#1ed760', '#4ade80', '#22c55e',
  '#16a34a', '#15803d', '#1db954', '#1ed760', '#4ade80',
  '#22c55e', '#16a34a', '#15803d', '#1db954', '#1ed760',
];

export default function TopArtists({ artists }: Props) {
  const chartData = artists.slice(0, 10).map((a) => ({
    name: a.name.length > 15 ? a.name.slice(0, 15) + '...' : a.name,
    fullName: a.name,
    popularity: a.popularity,
  }));

  return (
    <div className="top-artists">
      <div className="top-artists-chart-section">
        <h3 className="section-title">Popularidade dos artistas</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={70}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
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
              <Bar dataKey="popularity" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={GREENS[i % GREENS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="top-artists-grid">
        {artists.map((artist, index) => (
          <motion.a
            key={artist.id}
            href={artist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="artist-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <div className="artist-rank">#{index + 1}</div>
            <div className="artist-img-wrapper">
              {artist.images[0] ? (
                <img src={artist.images[0].url} alt={artist.name} className="artist-img" />
              ) : (
                <div className="artist-img artist-img--placeholder" />
              )}
            </div>
            <div className="artist-info">
              <span className="artist-name">{artist.name}</span>
              <span className="artist-genres">
                {artist.genres.slice(0, 2).join(' \u00b7 ')}
              </span>
            </div>
            <div className="artist-popularity">
              <div className="artist-popularity-bar">
                <motion.div
                  className="artist-popularity-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${artist.popularity}%` }}
                  transition={{ delay: index * 0.04 + 0.3, duration: 0.6 }}
                />
              </div>
              <span className="artist-popularity-value">{artist.popularity}</span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
