/**
 * Renders a shareable card straight onto a <canvas>.
 *
 * Spotify's CDN (i.scdn.co) serves `Access-Control-Allow-Origin: *`, so artwork
 * can be loaded with crossOrigin="anonymous" and the canvas stays untainted —
 * which is what makes toBlob() (and therefore download + Web Share) possible.
 */

export type StoryFormat = 'story' | 'feed';
export type StoryLayout = 'list' | 'collage';

export interface StoryEntry {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  /** Used by the bar variant of the list layout (genres have no artwork). */
  value?: number;
}

export interface StoryOptions {
  headline: string;
  period: string;
  footer: string;
  entries: StoryEntry[];
  layout: StoryLayout;
  format: StoryFormat;
}

const GREEN = '#1ed760';
const BASE = '#121212';
const WHITE = '#ffffff';
const SUBDUED = '#b3b3b3';
const FONT =
  "'Figtree', 'Helvetica Neue', Helvetica, Arial, sans-serif";

interface Metrics {
  width: number;
  height: number;
  pad: number;
  labelY: number;
  headlineSize: number;
  headlineY: number;
  periodY: number;
  listTop: number;
  rowHeight: number;
  thumb: number;
  titleSize: number;
  subtitleSize: number;
  footerY: number;
  maxEntries: number;
  /** The 1:1 card has no room for names under a 3×3 grid. */
  collageCaptions: boolean;
}

const METRICS: Record<StoryFormat, Metrics> = {
  story: {
    width: 1080,
    height: 1920,
    pad: 88,
    labelY: 168,
    headlineSize: 86,
    headlineY: 286,
    periodY: 352,
    listTop: 470,
    rowHeight: 250,
    thumb: 168,
    titleSize: 46,
    subtitleSize: 32,
    footerY: 1790,
    maxEntries: 5,
    collageCaptions: true,
  },
  feed: {
    width: 1080,
    height: 1080,
    pad: 72,
    labelY: 118,
    headlineSize: 62,
    headlineY: 204,
    periodY: 256,
    listTop: 330,
    rowHeight: 126,
    thumb: 96,
    titleSize: 34,
    subtitleSize: 24,
    footerY: 1010,
    maxEntries: 5,
    collageCaptions: false,
  },
};

/* ── Helpers ───────────────────────────────────────────────── */

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Average color of an image, used to tint the backdrop. */
function averageColor(img: HTMLImageElement): [number, number, number] {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [40, 40, 40];
  ctx.drawImage(img, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trim()}…`;
}

function roundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  radius: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.clip();
  // Cover-fit: crop the long edge instead of squashing the artwork.
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
  ctx.restore();
}

function placeholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
  glyph: string,
) {
  ctx.save();
  ctx.fillStyle = '#282828';
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();
  ctx.fillStyle = '#4d4d4d';
  ctx.font = `700 ${Math.round(size * 0.4)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x + size / 2, y + size / 2);
  ctx.restore();
}

/* ── Background ────────────────────────────────────────────── */

function paintBackground(
  ctx: CanvasRenderingContext2D,
  m: Metrics,
  tint: [number, number, number] | null,
) {
  ctx.fillStyle = BASE;
  ctx.fillRect(0, 0, m.width, m.height);

  if (tint) {
    const [r, g, b] = tint;
    const glow = ctx.createRadialGradient(
      m.width * 0.5,
      m.height * 0.18,
      0,
      m.width * 0.5,
      m.height * 0.18,
      m.height * 0.72,
    );
    glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
    glow.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.14)`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, m.width, m.height);
  }

  // Darken the bottom so the footer always stays legible.
  const fade = ctx.createLinearGradient(0, m.height * 0.55, 0, m.height);
  fade.addColorStop(0, 'rgba(18, 18, 18, 0)');
  fade.addColorStop(1, 'rgba(18, 18, 18, 0.92)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, m.width, m.height);
}

function paintHeader(ctx: CanvasRenderingContext2D, m: Metrics, options: StoryOptions) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = GREEN;
  ctx.font = `700 ${Math.round(m.headlineSize * 0.3)}px ${FONT}`;
  const label = 'MEU RESUMO';
  ctx.letterSpacing = '4px';
  ctx.fillText(label, m.pad, m.labelY);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = WHITE;
  ctx.font = `800 ${m.headlineSize}px ${FONT}`;
  ctx.fillText(truncate(ctx, options.headline, m.width - m.pad * 2), m.pad, m.headlineY);

  ctx.fillStyle = SUBDUED;
  ctx.font = `500 ${Math.round(m.headlineSize * 0.4)}px ${FONT}`;
  ctx.fillText(options.period, m.pad, m.periodY);
}

function paintFooter(ctx: CanvasRenderingContext2D, m: Metrics, options: StoryOptions) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const size = Math.round(m.headlineSize * 0.34);
  ctx.font = `700 ${size}px ${FONT}`;

  // Green dot + name, echoing the app's own accent usage.
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(m.pad + size * 0.35, m.footerY, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.fillText(options.footer, m.pad + size * 1.1, m.footerY);
}

/* ── Layouts ───────────────────────────────────────────────── */

function paintList(
  ctx: CanvasRenderingContext2D,
  m: Metrics,
  entries: StoryEntry[],
  images: (HTMLImageElement | null)[],
) {
  const maxValue = Math.max(...entries.map((e) => e.value ?? 0), 1);

  entries.forEach((entry, index) => {
    const y = m.listTop + index * m.rowHeight;
    const rankSize = Math.round(m.titleSize * 1.15);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = SUBDUED;
    ctx.font = `800 ${rankSize}px ${FONT}`;
    const rank = String(index + 1);
    const rankWidth = ctx.measureText('0').width;
    ctx.fillText(rank, m.pad, y + m.thumb / 2);

    const hasArtwork = entry.imageUrl !== undefined;
    const textX = hasArtwork
      ? m.pad + rankWidth + m.pad * 0.4 + m.thumb + m.pad * 0.35
      : m.pad + rankWidth + m.pad * 0.4;

    if (hasArtwork) {
      const imgX = m.pad + rankWidth + m.pad * 0.4;
      const radius = Math.round(m.thumb * 0.12);
      const img = images[index];
      if (img) {
        roundedImage(ctx, img, imgX, y, m.thumb, radius);
      } else {
        placeholder(ctx, imgX, y, m.thumb, radius, entry.title.charAt(0).toUpperCase());
      }
    }

    const textWidth = m.width - m.pad - textX;

    ctx.fillStyle = WHITE;
    ctx.font = `700 ${m.titleSize}px ${FONT}`;
    const titleY = entry.subtitle || entry.value !== undefined
      ? y + m.thumb / 2 - m.subtitleSize * 0.7
      : y + m.thumb / 2;
    ctx.fillText(truncate(ctx, entry.title, textWidth), textX, titleY);

    if (entry.subtitle) {
      ctx.fillStyle = SUBDUED;
      ctx.font = `400 ${m.subtitleSize}px ${FONT}`;
      ctx.fillText(
        truncate(ctx, entry.subtitle, textWidth),
        textX,
        titleY + m.subtitleSize * 1.5,
      );
    }

    if (entry.value !== undefined) {
      const barY = titleY + m.subtitleSize * 0.9;
      const barH = Math.round(m.subtitleSize * 0.45);
      const barW = textWidth * (entry.value / maxValue);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(textX, barY, textWidth, barH, barH / 2);
      ctx.fill();

      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.roundRect(textX, barY, Math.max(barW, barH), barH, barH / 2);
      ctx.fill();
    }
  });
}

function paintCollage(
  ctx: CanvasRenderingContext2D,
  m: Metrics,
  entries: StoryEntry[],
  images: (HTMLImageElement | null)[],
) {
  const columns = 3;
  const gap = Math.round(m.pad * 0.22);
  const shown = entries.slice(0, 9);
  const rows = Math.ceil(shown.length / columns);
  const captions = m.collageCaptions ? Math.min(shown.length, 3) : 0;

  // Reserve the caption block and the footer first, then fit the grid in the rest —
  // sizing on width alone overflows the 1:1 card.
  const captionBlock = captions
    ? captions * m.titleSize * 1.7 + m.pad * 0.5
    : 0;
  const available = m.footerY - m.titleSize * 0.8 - m.listTop - captionBlock;

  const cell = Math.floor(
    Math.min(
      (m.width - m.pad * 2 - gap * (columns - 1)) / columns,
      (available - gap * (rows - 1)) / rows,
    ),
  );
  const gridWidth = cell * columns + gap * (columns - 1);
  const originX = Math.round((m.width - gridWidth) / 2);
  const radius = Math.round(cell * 0.08);

  shown.forEach((entry, index) => {
    const x = originX + (index % columns) * (cell + gap);
    const y = m.listTop + Math.floor(index / columns) * (cell + gap);
    const img = images[index];
    if (img) {
      roundedImage(ctx, img, x, y, cell, radius);
    } else {
      placeholder(ctx, x, y, cell, radius, entry.title.charAt(0).toUpperCase());
    }
  });

  if (!captions) return;

  const captionTop = m.listTop + rows * (cell + gap) + m.pad * 0.5;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  shown.slice(0, captions).forEach((entry, index) => {
    ctx.fillStyle = index === 0 ? GREEN : WHITE;
    ctx.font = `700 ${m.titleSize}px ${FONT}`;
    ctx.fillText(
      truncate(ctx, `${index + 1}. ${entry.title}`, m.width - m.pad * 2),
      m.pad,
      captionTop + index * m.titleSize * 1.7,
    );
  });
}

/* ── Entry point ───────────────────────────────────────────── */

export async function renderStory(
  canvas: HTMLCanvasElement,
  options: StoryOptions,
): Promise<void> {
  const m = METRICS[options.format];
  canvas.width = m.width;
  canvas.height = m.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D não disponível');

  // Without this the first render falls back to a system font.
  if (typeof document.fonts !== 'undefined') {
    await Promise.all([
      document.fonts.load(`800 ${m.headlineSize}px Figtree`),
      document.fonts.load(`700 ${m.titleSize}px Figtree`),
      document.fonts.load(`400 ${m.subtitleSize}px Figtree`),
    ]).catch(() => undefined);
  }

  const limit = options.layout === 'collage' ? 9 : m.maxEntries;
  const entries = options.entries.slice(0, limit);
  const images = await Promise.all(
    entries.map((entry) => (entry.imageUrl ? loadImage(entry.imageUrl) : null)),
  );

  const firstImage = images.find((img): img is HTMLImageElement => img !== null) ?? null;
  paintBackground(ctx, m, firstImage ? averageColor(firstImage) : null);
  paintHeader(ctx, m, options);

  if (options.layout === 'collage') {
    paintCollage(ctx, m, entries, images);
  } else {
    paintList(ctx, m, entries, images);
  }

  paintFooter(ctx, m, options);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))),
      'image/png',
    );
  });
}
