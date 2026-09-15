import { useEffect, useState, type RefObject } from 'react';
import { renderStory } from '../lib/storyCanvas';
import type { StoryOptions } from '../lib/storyCanvas';

/** Repaints the card whenever the chosen template, format or data changes. */
export function useStoryCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: StoryOptions,
) {
  const [painted, setPainted] = useState<{ options: StoryOptions; error: string | null } | null>(
    null,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !options.entries.length) return;

    let cancelled = false;

    renderStory(canvas, options)
      .then(() => {
        if (!cancelled) setPainted({ options, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPainted({
          options,
          error: err instanceof Error ? err.message : 'Erro ao gerar a imagem',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [canvasRef, options]);

  // `options` is memoised upstream, so identity is the freshness check.
  const current = painted?.options === options ? painted : null;

  return {
    rendering: current === null,
    renderError: current?.error ?? null,
  };
}
