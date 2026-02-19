import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import './ChatWidget.css';

type RecommendationType = 'album' | 'artist' | 'music';

const PLACEHOLDERS = [
  'Ex: quero algo animado pra academia...',
  'Ex: música indie pra uma tarde chuvosa...',
  'Ex: algo novo parecido com o que já ouço...',
  'Ex: artistas brasileiros que posso estar perdendo...',
  'Ex: álbum pra ouvir antes de dormir...',
  'Ex: som eletrônico que não seja muito pesado...',
];

type SpotifyItem = {
  id: string;
  name: string;
  type: 'track' | 'artist' | 'album';
  imageUrl: string;
  spotifyUrl: string;
  artist?: string;
};

type Message =
  | { role: 'bot'; kind: 'text'; text: string }
  | { role: 'bot'; kind: 'selector' }
  | { role: 'bot'; kind: 'cards'; explanation: string; items: SpotifyItem[] }
  | { role: 'user'; kind: 'text'; text: string };

const TYPE_LABELS: Record<RecommendationType, string> = {
  artist: 'Artistas',
  music: 'Músicas',
  album: 'Álbuns',
};

const TYPE_ICONS: Record<RecommendationType, string> = {
  artist: '🎤',
  music: '🎵',
  album: '💿',
};

const RESET_GREETINGS = [
  'O que mais você quer explorar?',
  'Pronto pra mais descobertas?',
  'Que tal explorar outra coisa?',
  'Me conta o que mais você procura...',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', kind: 'text', text: 'O que você quer descobrir hoje?' },
    { role: 'bot', kind: 'selector' },
  ]);
  const [selected, setSelected] = useState<RecommendationType[]>([]);
  const [step, setStep] = useState<'select' | 'input' | 'done'>('select');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const placeholderIndexRef = useRef(0);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function toggleType(type: RecommendationType) {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function confirmSelection() {
    if (selected.length === 0) return;
    const label = selected.map((t) => TYPE_LABELS[t]).join(', ');
    setMessages((prev) => [
      ...prev,
      { role: 'user', kind: 'text', text: `Quero descobrir: ${label}` },
      { role: 'bot', kind: 'text', text: 'Perfeito! Me conta o que você está procurando...' },
    ]);
    setStep('input');
  }

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: 'user', kind: 'text', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chat(selected, msg);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', kind: 'cards', explanation: response.explanation, items: response.items },
      ]);
      setStep('done');
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', kind: 'text', text: 'Algo deu errado. Tente novamente.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    const greetingIdx = Math.floor(Math.random() * RESET_GREETINGS.length);
    placeholderIndexRef.current = (placeholderIndexRef.current + 1) % PLACEHOLDERS.length;
    setPlaceholder(PLACEHOLDERS[placeholderIndexRef.current]);
    setMessages((prev) => [
      ...prev,
      { role: 'bot', kind: 'text', text: RESET_GREETINGS[greetingIdx] },
      { role: 'bot', kind: 'selector' },
    ]);
    setSelected([]);
    setStep('select');
    setInput('');
  }

  return (
    <>
      <button
        className={`chat-fab ${open ? 'chat-fab--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir chat"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H6l-2 2V4h16v10z" />
          </svg>
        )}
        {!open && <span className="chat-fab-label">Music AI</span>}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel__header">
            <div className="chat-panel__header-info">
              <div className="chat-panel__avatar">✦</div>
              <div>
                <p className="chat-panel__name">Music AI</p>
                <p className="chat-panel__status">powered by Gemini</p>
              </div>
            </div>
          </div>

          <div className="chat-panel__messages">
            {messages.map((msg, i) => {
              if (msg.role === 'bot' && msg.kind === 'text') {
                return (
                  <div key={i} className="chat-msg chat-msg--bot">
                    <span className="chat-msg__bubble">{msg.text}</span>
                  </div>
                );
              }

              if (msg.role === 'bot' && msg.kind === 'selector') {
                return (
                  <div key={i} className="chat-msg chat-msg--bot chat-msg--selector">
                    <div className="chat-type-grid">
                      {(Object.keys(TYPE_LABELS) as RecommendationType[]).map((type) => (
                        <button
                          key={type}
                          className={`chat-type-btn ${selected.includes(type) ? 'chat-type-btn--active' : ''}`}
                          onClick={() => step === 'select' && toggleType(type)}
                          disabled={step !== 'select'}
                        >
                          <span className="chat-type-btn__icon">{TYPE_ICONS[type]}</span>
                          <span>{TYPE_LABELS[type]}</span>
                        </button>
                      ))}
                    </div>
                    {step === 'select' && (
                      <button
                        className="chat-confirm-btn"
                        onClick={confirmSelection}
                        disabled={selected.length === 0}
                      >
                        Continuar →
                      </button>
                    )}
                  </div>
                );
              }

              if (msg.role === 'bot' && msg.kind === 'cards') {
                return (
                  <div key={i} className="chat-msg chat-msg--bot chat-msg--cards">
                    <span className="chat-msg__bubble">{msg.explanation}</span>
                    <div className="chat-cards-grid">
                      {msg.items.map((item, idx) => (
                        <a
                          key={item.id}
                          href={item.spotifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="chat-card"
                          style={{ animationDelay: `${idx * 80}ms` }}
                        >
                          {item.imageUrl ? (
                            <img className="chat-card__img" src={item.imageUrl} alt={item.name} />
                          ) : (
                            <div className="chat-card__img chat-card__img--placeholder">♪</div>
                          )}
                          <div className="chat-card__info">
                            <p className="chat-card__name">{item.name}</p>
                            {item.artist && <p className="chat-card__artist">{item.artist}</p>}
                            <span className="chat-card__type">{item.type}</span>
                          </div>
                          <div className="chat-card__play">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                    <button className="chat-reset-btn" onClick={reset}>
                      + Nova pergunta
                    </button>
                  </div>
                );
              }

              if (msg.role === 'user') {
                return (
                  <div key={i} className="chat-msg chat-msg--user">
                    <span className="chat-msg__bubble">{msg.text}</span>
                  </div>
                );
              }

              return null;
            })}

            {loading && (
              <div className="chat-msg chat-msg--bot">
                <span className="chat-msg__bubble chat-typing">
                  <span /><span /><span />
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {step === 'input' && (
            <div className="chat-panel__input">
              <input
                className="chat-input"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                autoFocus
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
