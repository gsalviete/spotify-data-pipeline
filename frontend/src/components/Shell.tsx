import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { TimeRange } from '../services/api';
import type { UserProfile } from '../types/spotify';
import { timeRangeOptions } from '../lib/timeRange';
import { useDemo } from '../demo/context';
import './Shell.css';

/* ── Icons ─────────────────────────────────────────────────── */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const navItems = [
  {
    key: 'overview',
    label: 'Overview',
    path: '/dashboard',
    icon: (
      <svg {...iconProps}>
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
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: 'share',
    label: 'Compartilhar',
    path: '/share',
    icon: (
      <svg {...iconProps}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
];

/* ── State screens ─────────────────────────────────────────── */

export function LoadingState({ label = 'Carregando seus dados...' }: { label?: string }) {
  return (
    <div className="dash-loading">
      <div className="dash-loading-spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="dash-loading">
      <p className="dash-error">Erro: {message}</p>
    </div>
  );
}

/* ── Confirm dialog ────────────────────────────────────────── */

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  // Portalled to the body: the sidebar it is triggered from is `position:
  // sticky`, which creates a stacking context the overlay's z-index cannot
  // escape — it would render behind the page content.
  return createPortal(
    <div className="dash-dialog-overlay" onClick={onCancel}>
      <motion.div
        className="dash-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dash-dialog-title"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <h2 className="dash-dialog-title" id="dash-dialog-title">{title}</h2>
        <p className="dash-dialog-message">{message}</p>
        <div className="dash-dialog-actions">
          <button className="dash-dialog-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="dash-dialog-btn dash-dialog-btn--danger"
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

/* ── Demo mode ─────────────────────────────────────────────── */

function DemoBanner() {
  return (
    <div className="dash-demo-banner">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span>
        Modo demonstra&ccedil;&atilde;o &mdash; dados de exemplo, capturados previamente.
      </span>
    </div>
  );
}

function DemoProfilePicker() {
  const { profiles, profile, selectProfile } = useDemo();

  if (profiles.length < 2 || !profile) return null;

  return (
    <label className="dash-demo-picker">
      <span className="dash-demo-picker-label">Perfil</span>
      <select
        className="dash-demo-picker-select"
        value={profile.id}
        onChange={(event) => selectProfile(event.target.value)}
      >
        {profiles.map((option) => (
          <option key={option.id} value={option.id}>
            {option.user.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ── Time range filter ─────────────────────────────────────── */

export function TimeRangeFilter({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  return (
    <div className="dash-time-filters">
      {timeRangeOptions.map((option) => (
        <button
          key={option.key}
          className={`dash-time-btn ${value === option.key ? 'dash-time-btn--active' : ''}`}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ── User ──────────────────────────────────────────────────── */

function Sidebar({ user }: { user: UserProfile | null }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { demo, exitDemo } = useDemo();
  // Leaving is one misplaced click away, so it always asks first.
  const [confirmingExit, setConfirmingExit] = useState(false);

  function confirmExit() {
    setConfirmingExit(false);
    if (demo) {
      // Nothing to end server-side: drop the local flag and go back to login.
      exitDemo();
      return;
    }
    api.logout();
  }

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-logo">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      </div>

      <nav className="dash-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`dash-nav-btn ${pathname === item.path ? 'dash-nav-btn--active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span>{item.label}</span>
            {pathname === item.path && (
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
          <button
            className="dash-logout-btn"
            onClick={() => setConfirmingExit(true)}
            title={demo ? 'Sair da demonstracao' : 'Sair'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {confirmingExit && (
        <ConfirmDialog
          title={demo ? 'Sair da demonstracao?' : 'Sair da conta?'}
          message={
            demo
              ? 'Voce volta para a tela de login. Pode entrar na demonstracao de novo quando quiser.'
              : 'Sua sessao sera encerrada e voce precisara entrar de novo com o Spotify.'
          }
          confirmLabel="Sair"
          onConfirm={confirmExit}
          onCancel={() => setConfirmingExit(false)}
        />
      )}
    </aside>
  );
}

/* ── Page shell ────────────────────────────────────────────── */

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  user: UserProfile | null;
  children: ReactNode;
}

export default function PageShell({ title, subtitle, actions, user, children }: PageShellProps) {
  const { demo } = useDemo();

  return (
    <div className="dash">
      <Sidebar user={user} />

      <main className="dash-main">
        {demo && <DemoBanner />}

        <header className="dash-header">
          <div>
            <motion.h1
              className="dash-header-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.h1>
            {subtitle && <p className="dash-header-subtitle">{subtitle}</p>}
          </div>
          <div className="dash-header-actions">
            <DemoProfilePicker />
            {actions}
          </div>
        </header>

        <div className="dash-content">{children}</div>
      </main>
    </div>
  );
}
