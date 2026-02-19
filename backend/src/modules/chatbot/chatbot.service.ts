import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { DashboardService } from '../dashboard/dashboard.service';
import { ChatbotDto, RecommendationType } from './dto/chatbot-dto';

type OverviewData = Awaited<ReturnType<DashboardService['getOverview']>>;
type ContextKey = keyof OverviewData;

type RecommendationItem = {
  name: string;
  artist?: string;
  type: 'track' | 'artist' | 'album';
};

export type ResolvedItem = {
  id: string;
  name: string;
  type: 'track' | 'artist' | 'album';
  imageUrl: string;
  spotifyUrl: string;
  artist?: string;
};

const INTENT_MAP: Record<RecommendationType, string> = {
  [RecommendationType.ALBUM]:  'Recomende álbuns que o usuário ainda não conhece, baseado nos seus gostos',
  [RecommendationType.ARTIST]: 'Recomende artistas novos para o usuário descobrir, fora dos que ele já ouve',
  [RecommendationType.MUSIC]:  'Recomende músicas específicas que o usuário vai gostar, mas ainda não conhece',
};

const CONTEXT_MAP: Record<RecommendationType, ContextKey[]> = {
  [RecommendationType.ALBUM]:  ['artists'],
  [RecommendationType.ARTIST]: ['artists', 'genres'],
  [RecommendationType.MUSIC]:  ['tracks', 'recentlyPlayed'],
};

const DEFAULT_INTENT = 'Responda à pergunta do usuário sobre música com base nos dados fornecidos';

@Injectable()
export class ChatbotService {
  private readonly gemini: GoogleGenAI;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly configService: ConfigService,
  ) {
    this.gemini = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
  }

  async chat(userId: string, dto: ChatbotDto) {
    const userData = await this.dashboardService.getOverview(userId);
    const filteredData = this.filterContext(userData, dto.basedOn);
    const prompt = this.buildPrompt(filteredData, dto);
    const raw = await this.callLLM(prompt);
    const parsed = this.parseJson(raw);
    const items = await this.resolveItems(userId, parsed.recommendations);
    return { explanation: parsed.explanation, items };
  }

  private filterContext(data: OverviewData, basedOn: RecommendationType[]): Partial<OverviewData> {
    const keys = new Set<ContextKey>(
      basedOn.flatMap((intent) => CONTEXT_MAP[intent]),
    );
    return Object.fromEntries(
      [...keys].map((key) => [key, data[key]]),
    ) as Partial<OverviewData>;
  }

  private buildKnownItems(userData: Partial<OverviewData>): string {
    const items: string[] = [];

    if (userData.tracks) {
      for (const t of userData.tracks as any[]) {
        items.push(`música: "${t.name}" de ${t.artists?.[0]?.name ?? ''}`);
      }
    }
    if (userData.artists) {
      for (const a of userData.artists as any[]) {
        items.push(`artista: "${a.name}"`);
      }
    }
    if (userData.recentlyPlayed) {
      for (const r of userData.recentlyPlayed as any[]) {
        const t = r.track;
        if (t) items.push(`música: "${t.name}" de ${t.artists?.[0]?.name ?? ''}`);
      }
    }

    return [...new Set(items)].join('\n');
  }

  private buildPrompt(userData: Partial<OverviewData>, dto: ChatbotDto): string {
    const intents = dto.basedOn.map((option) => INTENT_MAP[option]).join('\n- ');
    const intent = intents.length > 0 ? `- ${intents}` : DEFAULT_INTENT;
    const spotifyContext = JSON.stringify(userData, null, 2);
    const knownItems = this.buildKnownItems(userData);

    return `
Você é um assistente especializado em música.
Responda sempre em português, de forma amigável e concisa.

Estes são os dados do Spotify do usuário (o que ele JÁ OUVE — use apenas como referência de gosto):
${spotifyContext}

REGRA CRÍTICA: NÃO recomende NENHUM dos itens abaixo. O usuário já conhece tudo isso:
${knownItems}

Intenção do usuário:
${intent}

Pedido: ${dto.message}

Recomende apenas itens que o usuário provavelmente ainda NÃO conhece, mas que combinam com o gosto dele.
Pense em descobertas reais: artistas menores, lados-B, colaborações menos conhecidas, gêneros adjacentes.

IMPORTANTE: Responda SOMENTE com um JSON válido, sem markdown, neste formato exato:
{
  "explanation": "texto explicativo em português, amigável e conciso (2-3 frases)",
  "recommendations": [
    { "name": "nome do item", "artist": "artista (apenas para músicas e álbuns)", "type": "track|artist|album" }
  ]
}
Retorne entre 3 e 6 recomendações.
    `.trim();
  }

  private parseJson(text: string): { explanation: string; recommendations: RecommendationItem[] } {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  private async resolveItems(userId: string, recommendations: RecommendationItem[]): Promise<ResolvedItem[]> {
    const results = await Promise.all(
      recommendations.map(async (rec) => {
        try {
          const query = rec.artist ? `${rec.name} ${rec.artist}` : rec.name;
          const data = await this.dashboardService.searchSpotify(userId, query, rec.type);
          const items = data[`${rec.type}s`]?.items;
          const item = items?.[0];
          if (!item) return null;

          const imageUrl =
            rec.type === 'track'
              ? item.album?.images?.[0]?.url
              : item.images?.[0]?.url;

          const resolved: ResolvedItem = {
            id: item.id,
            name: item.name,
            type: rec.type,
            imageUrl: imageUrl ?? '',
            spotifyUrl: item.external_urls?.spotify ?? '',
            artist: rec.type !== 'artist' ? item.artists?.[0]?.name : undefined,
          };
          return resolved;
        } catch {
          return null;
        }
      }),
    );
    return results.filter((item): item is ResolvedItem => item !== null);
  }

  private async callLLM(prompt: string): Promise<string> {
    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text ?? '';
  }
}
