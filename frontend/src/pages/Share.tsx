import { useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDashboardData } from '../hooks/useDashboardData';
import type { TimeRange } from '../services/api';
import PageShell, {
  LoadingState,
  ErrorState,
  TimeRangeFilter,
} from '../components/Shell';
import { useUser } from '../hooks/useUser';
import { useStoryCanvas } from '../hooks/useStoryCanvas';
import { timeRangeLabel } from '../lib/timeRange';
import { canvasToBlob } from '../lib/storyCanvas';
import type { StoryEntry, StoryFormat, StoryLayout } from '../lib/storyCanvas';
import './Share.css';

type TemplateKey = 'artists' | 'tracks' | 'genres' | 'collage';

const templates: { key: TemplateKey; label: string; headline: string; layout: StoryLayout }[] = [
  { key: 'artists', label: 'Top Artistas', headline: 'Top Artistas', layout: 'list' },
  { key: 'tracks', label: 'Top Faixas', headline: 'Top Faixas', layout: 'list' },
  { key: 'genres', label: 'Top Gêneros', headline: 'Top Gêneros', layout: 'list' },
  { key: 'collage', label: 'Mosaico', headline: 'Meus Artistas', layout: 'collage' },
];

const formats: { key: StoryFormat; label: string; hint: string }[] = [
  { key: 'story', label: 'Story', hint: '9:16 · 1080×1920' },
  { key: 'feed', label: 'Feed', hint: '1:1 · 1080×1080' },
];

export default function Share() {
  const user = useUser();
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [template, setTemplate] = useState<TemplateKey>('artists');
  const [format, setFormat] = useState<StoryFormat>('story');
  const [status, setStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { artists, tracks, genres, loading, error } = useDashboardData(timeRange);

  const active = templates.find((t) => t.key === template)!;

  const entries = useMemo<StoryEntry[]>(() => {
    switch (template) {
      case 'tracks':
        return tracks.slice(0, 5).map((track) => ({
          title: track.name,
          subtitle: track.artists.map((a) => a.name).join(', '),
          imageUrl: track.album.images[0]?.url ?? null,
        }));

      case 'genres':
        // No `imageUrl` key at all — that's what switches the row to the bar variant.
        return genres.slice(0, 5).map((genre) => ({
          title: genre.genre,
          value: genre.count,
        }));

      case 'collage':
        return artists.slice(0, 9).map((artist) => ({
          title: artist.name,
          imageUrl: artist.images[0]?.url ?? null,
        }));

      case 'artists':
      default:
        return artists.slice(0, 5).map((artist) => ({
          title: artist.name,
          subtitle: artist.genres.slice(0, 2).join(' · ') || 'Artista',
          imageUrl: artist.images[0]?.url ?? null,
        }));
    }
  }, [template, artists, tracks, genres]);

  const options = useMemo(
    () => ({
      headline: active.headline,
      period: timeRangeLabel(timeRange),
      footer: user?.displayName ?? 'Spotify Stats',
      entries,
      layout: active.layout,
      format,
    }),
    [active, timeRange, user, entries, format],
  );

  const { rendering, renderError } = useStoryCanvas(canvasRef, options);

  const fileName = `spotify-${template}-${timeRange}-${format}.png`;

  const download = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus('Imagem salva — é só subir no seu story.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }, [fileName]);

  const share = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: active.headline });
        return;
      }
      await download();
    } catch (err) {
      // An aborted share sheet is a normal user action, not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setStatus(err instanceof Error ? err.message : 'Erro ao compartilhar');
    }
  }, [fileName, active.headline, download]);

  if (loading) return <LoadingState label="Montando seu card..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <PageShell
      title="Compartilhar"
      subtitle="Gere um card pronto para o story do Instagram"
      user={user}
      actions={<TimeRangeFilter value={timeRange} onChange={setTimeRange} />}
    >
      <div className="share-layout">
        {/* ── Controls ─────────────────────────────────────── */}
        <div className="share-controls">
          <div className="share-group" role="group" aria-labelledby="share-template-label">
            <span className="share-group-label" id="share-template-label">Modelo</span>
            <div className="share-options share-options--templates">
              {templates.map((option) => (
                <button
                  key={option.key}
                  className={`share-option ${template === option.key ? 'share-option--active' : ''}`}
                  onClick={() => setTemplate(option.key)}
                  aria-pressed={template === option.key}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="share-group" role="group" aria-labelledby="share-format-label">
            <span className="share-group-label" id="share-format-label">Formato</span>
            <div className="share-options share-options--formats">
              {formats.map((option) => (
                <button
                  key={option.key}
                  className={`share-option ${format === option.key ? 'share-option--active' : ''}`}
                  onClick={() => setFormat(option.key)}
                  aria-pressed={format === option.key}
                >
                  {option.label}
                  <span className="share-option-hint">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="share-actions">
            <button className="share-btn share-btn--primary" onClick={share} disabled={rendering}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Compartilhar
            </button>
            <button className="share-btn" onClick={download} disabled={rendering}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Baixar PNG
            </button>
          </div>

          <p className="share-note">
            {renderError ??
              status ??
              'No celular, “Compartilhar” abre direto o menu do sistema — escolha o Instagram. No desktop, baixe o PNG e envie para o telefone.'}
          </p>
        </div>

        {/* ── Preview ──────────────────────────────────────── */}
        <motion.div
          className={`share-preview share-preview--${format}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <canvas ref={canvasRef} className="share-canvas" aria-label="Prévia do card" />
          {rendering && <div className="share-preview-overlay">Gerando…</div>}
        </motion.div>
      </div>
    </PageShell>
  );
}
