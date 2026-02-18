import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDashboardData } from '../hooks/useDashboardData';
import { api } from '../services/api';
import type { TimeRange } from '../services/api';
import TopArtists from '../components/TopArtists';
import TopTracks from '../components/TopTracks';
import TopGenres from '../components/TopGenres';
import './Dashboard.css';

const navItems = [
  {
    key: 'overview',
    label: 'Overview',
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'recent',
    label: 'Recentes',
    path: '/recently-played',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const timeRangeOptions: { key: TimeRange; label: string }[] = [
  { key: 'short_term', label: '4 semanas' },
  { key: 'medium_term', label: '6 meses' },
  { key: 'long_term', label: 'Todo período' },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const { user, artists, tracks, genres, loading, error } = useDashboardData(timeRange);

  const currentPath = location.pathname;

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-spinner" />
        <p>Carregando seus dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-loading">
        <p className="dash-error">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#1db954">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>

        <nav className="dash-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`dash-nav-btn ${currentPath === item.path ? 'dash-nav-btn--active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
              {currentPath === item.path && (
                <motion.div
                  className="dash-nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {user && (
          <div className="dash-user">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="dash-user-avatar" />
            ) : (
              <div className="dash-user-avatar dash-user-avatar--placeholder">
                {user.displayName?.charAt(0) || '?'}
              </div>
            )}
            <div className="dash-user-info">
              <span className="dash-user-name">{user.displayName}</span>
              <span className="dash-user-email">{user.email}</span>
            </div>
            <button className="dash-logout-btn" onClick={() => api.logout()} title="Sair">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <motion.h1
              className="dash-header-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              Overview
            </motion.h1>
            <p className="dash-header-subtitle">
              {timeRangeOptions.find((o) => o.key === timeRange)?.label}
            </p>
          </div>
          <div className="dash-time-filters">
            {timeRangeOptions.map((option) => (
              <button
                key={option.key}
                className={`dash-time-btn ${timeRange === option.key ? 'dash-time-btn--active' : ''}`}
                onClick={() => setTimeRange(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <div className="dash-content">
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
        </div>
      </main>
    </div>
  );
}
