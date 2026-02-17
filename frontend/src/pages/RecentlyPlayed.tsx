import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { RecentlyPlayedItem, UserProfile } from '../types/spotify';
import './RecentlyPlayed.css';

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

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

export default function RecentlyPlayed() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<RecentlyPlayedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPath = location.pathname;

  useEffect(() => {
    async function fetchData() {
      try {
        const [userData, recentData] = await Promise.all([
          api.getMe(),
          api.getRecentlyPlayed(),
        ]);
        setUser(userData);
        setItems(recentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
              Tocadas Recentemente
            </motion.h1>
            <p className="dash-header-subtitle">Suas últimas músicas ouvidas</p>
          </div>
        </header>

        <div className="dash-content">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
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
        </div>
      </main>
    </div>
  );
}
