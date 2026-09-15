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
import { useMediaQuery } from '../hooks/useMediaQuery';
import './TopGenres.css';

interface Props {
  genres: GenreCount[];
}

export default function TopGenres({ genres }: Props) {
  const narrow = useMediaQuery('(max-width: 600px)');
  const topGenres = genres.slice(0, 10);

  // Ten spokes with long labels turn to mush at phone width — thin them out.
  const labelLimit = narrow ? 9 : 14;
  const radarData = topGenres.slice(0, narrow ? 6 : 10).map((g) => ({
    genre: g.genre.length > labelLimit ? g.genre.slice(0, labelLimit) + '...' : g.genre,
    fullGenre: g.genre,
    count: g.count,
  }));

  const maxCount = Math.max(...topGenres.map((g) => g.count), 1);

  return (
    <div className="top-genres">
      <div className="top-genres-radar">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={narrow ? 260 : 380}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={narrow ? '62%' : '72%'}>
              <PolarGrid stroke="#4d4d4d" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="genre"
                tick={{ fill: '#b3b3b3', fontSize: narrow ? 10 : 12, fontWeight: 400 }}
              />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, maxCount]} />
              <Tooltip
                cursor={{ stroke: '#7c7c7c' }}
                contentStyle={{
                  background: '#282828',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  boxShadow: 'rgba(0,0,0,0.5) 0px 8px 24px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 14,
                }}
                labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                itemStyle={{ color: '#b3b3b3' }}
                formatter={(value) => [`${value} artistas`]}
              />
              <Radar
                name="Gêneros"
                dataKey="count"
                stroke="#1ed760"
                fill="#1ed760"
                fillOpacity={0.22}
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
