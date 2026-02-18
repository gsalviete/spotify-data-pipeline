import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { GenreCount } from '../types/spotify';
import './TopGenres.css';

interface Props {
  genres: GenreCount[];
}

export default function TopGenres({ genres }: Props) {
  const topGenres = genres.slice(0, 10);
  const radarData = topGenres.map((g) => ({
    genre: g.genre.length > 14 ? g.genre.slice(0, 14) + '...' : g.genre,
    fullGenre: g.genre,
    count: g.count,
  }));

  const maxCount = Math.max(...topGenres.map((g) => g.count), 1);

  return (
    <div className="top-genres">
      <div className="top-genres-radar">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="genre"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              />
              <PolarRadiusAxis
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                axisLine={false}
                domain={[0, maxCount]}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(24,24,24,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  fontFamily: 'Outfit',
                }}
                labelStyle={{ color: '#fff', fontWeight: 600 }}
                itemStyle={{ color: '#1db954' }}
                formatter={(value) => [`${value} artistas`]}
              />
              <Radar
                name="Gêneros"
                dataKey="count"
                stroke="#1db954"
                fill="#1db954"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="top-genres-ranking">
        <h3 className="genres-ranking-title">Ranking</h3>
        <div className="genres-ranking-list">
          {topGenres.map((g, index) => (
            <motion.div
              key={g.genre}
              className="genre-rank-item"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
            >
              <span className="genre-rank-pos">{index + 1}</span>
              <div className="genre-rank-content">
                <span className="genre-rank-name">{g.genre}</span>
                <div className="genre-rank-bar">
                  <motion.div
                    className="genre-rank-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(g.count / maxCount) * 100}%` }}
                    transition={{ delay: index * 0.04 + 0.2, duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
