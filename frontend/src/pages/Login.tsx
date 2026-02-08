import { motion } from 'framer-motion';
import { api } from '../services/api';
import './Login.css';

const bars = Array.from({ length: 5 }, (_, i) => i);

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-bg-noise" />
      <div className="login-glow login-glow--1" />
      <div className="login-glow login-glow--2" />
      <div className="login-glow login-glow--3" />

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-logo">
          <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <span className="login-logo-text">Data Pipeline</span>
        </div>

        <h1 className="login-title">
          Descubra seu
          <br />
          <span className="login-title-accent">universo musical</span>
        </h1>

        <p className="login-subtitle">
          Visualize seus artistas, faixas e g&ecirc;neros mais ouvidos com dashboards interativos.
        </p>

        <div className="login-equalizer">
          {bars.map((i) => (
            <motion.div
              key={i}
              className="login-bar"
              animate={{
                height: ['12px', `${20 + Math.random() * 28}px`, '12px'],
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.12,
              }}
            />
          ))}
        </div>

        <motion.button
          className="login-btn"
          onClick={() => api.login()}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Entrar com Spotify
        </motion.button>

        <p className="login-footer">
          Seus dados s&atilde;o usados apenas para visualiza&ccedil;&atilde;o.
          <br />
          Nenhuma informa&ccedil;&atilde;o &eacute; armazenada permanentemente.
        </p>
      </motion.div>
    </div>
  );
}
