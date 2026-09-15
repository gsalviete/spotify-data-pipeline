import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardData } from '../hooks/useDashboardData';
import type { TimeRange } from '../services/api';
import PageShell, {
  LoadingState,
  ErrorState,
  TimeRangeFilter,
} from '../components/Shell';
import { useUser } from '../hooks/useUser';
import { timeRangeLabel } from '../lib/timeRange';
import TopArtists from '../components/TopArtists';
import TopTracks from '../components/TopTracks';
import TopGenres from '../components/TopGenres';
import './Dashboard.css';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const user = useUser();
  const { artists, tracks, genres, loading, error } = useDashboardData(timeRange);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <PageShell
      title="Overview"
      subtitle={timeRangeLabel(timeRange)}
      user={user}
      actions={<TimeRangeFilter value={timeRange} onChange={setTimeRange} />}
    >
      <div className="overview-top-row">
        <motion.section
          className="overview-section overview-section--half"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="overview-section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Top Artistas
          </h2>
          <TopArtists artists={artists} />
        </motion.section>

        <motion.section
          className="overview-section overview-section--half"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="overview-section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="15.5" r="2.5" />
              <path d="M8 17V5l12-2v12" />
            </svg>
            Top Faixas
          </h2>
          <TopTracks tracks={tracks} />
        </motion.section>
      </div>

      <motion.section
        className="overview-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="overview-section-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
          Top Gêneros
        </h2>
        <TopGenres genres={genres} />
      </motion.section>
    </PageShell>
  );
}
