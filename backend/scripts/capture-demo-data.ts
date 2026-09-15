/**
 * One-off tool that captures an anonymised demo dataset for the frontend.
 *
 *   npm run capture:demo
 *
 * It is not part of the build and nothing in the application calls it. It boots
 * the Nest container only to borrow the services the app already uses (auth,
 * user, dashboard, chatbot), so no Spotify or genre logic is reimplemented
 * here — the only new code is the anonymisation and the file writing.
 *
 * Mongo stores no listening history (the `users` collection holds credentials
 * and nothing else), so every musical payload below comes from a live Spotify
 * call made with the stored access token.
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// The repo keeps a single .env at the root; ConfigModule would look for
// backend/.env, so load it here before the container reads process.env.
loadEnv({ path: resolve(__dirname, '../../.env') });

import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { ChatbotService } from '../src/modules/chatbot/chatbot.service';
import { UserService } from '../src/modules/user/user.service';
import { RecommendationType } from '../src/modules/chatbot/dto/chatbot-dto';
import { User } from '../src/modules/user/schemas/user.schema';
import { TimeRange } from '../src/common/utils/term-util';

const OUTPUT_DIR = resolve(__dirname, '../../frontend/src/demo-data');

const TERMS: TimeRange[] = ['short_term', 'medium_term', 'long_term'];

/** Stand-in names, assigned by position so a re-run is reproducible. */
const DEMO_NAMES = [
  'Ana Ribeiro',
  'Bruno Tavares',
  'Clara Mendes',
  'Diego Aragao',
  'Elisa Fontes',
  'Rafael Nunes',
];

/** The single chat exchange recorded per profile, replayed in demo mode. */
const DEMO_CHAT_PROMPT = {
  basedOn: [RecommendationType.ARTIST, RecommendationType.MUSIC],
  message: 'quero descobrir algo novo que combine com o que eu ja escuto',
};

/**
 * `available_markets` is ~180 country codes repeated on every track and album:
 * pure noise once the JSON is indented, and nothing in the frontend reads it.
 * `context` on a recently played item can point at one of the listener's own
 * playlists, so it goes too.
 */
const DROPPED_KEYS = ['available_markets', 'context'];

const logger = new Logger('capture-demo-data');

function isUnauthorized(error: any): boolean {
  return error?.response?.status === 401;
}

/**
 * Same recovery the SpotifyTokenInterceptor performs for HTTP requests: on a
 * 401 refresh through AuthService and replay the call once. The dashboard
 * service re-reads the user on every call, so the retry picks up the new token.
 */
async function withTokenRefresh<T>(
  authService: AuthService,
  spotifyId: string,
  call: () => Promise<T>,
): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    logger.log('access token expired, refreshing');
    await authService.refreshAccessToken(spotifyId);
    return call();
  }
}

/** Deep clone that drops the keys listed above. */
function strip<T>(value: T): T {
  if (Array.isArray(value)) return value.map(strip) as unknown as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !DROPPED_KEYS.includes(key))
        .map(([key, nested]) => [key, strip(nested)]),
    ) as T;
  }
  return value;
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

async function clearPreviousOutput() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const existing = await readdir(OUTPUT_DIR);
  await Promise.all(
    existing
      .filter((file) => file.endsWith('.json'))
      .map((file) => unlink(resolve(OUTPUT_DIR, file))),
  );
}

/**
 * Re-reads what was written and fails loudly if any real credential or
 * identifier survived the anonymisation.
 */
async function assertNoSecretsLeaked(forbidden: Map<string, string>) {
  const files = (await readdir(OUTPUT_DIR)).filter((file) =>
    file.endsWith('.json'),
  );
  const leaks: string[] = [];

  for (const file of files) {
    const content = await readFile(resolve(OUTPUT_DIR, file), 'utf8');
    for (const [label, value] of forbidden) {
      if (value && content.includes(value)) leaks.push(`${file}: ${label}`);
    }
    for (const key of ['accessToken', 'refreshToken', 'spotifyId']) {
      if (content.includes(`"${key}"`))
        leaks.push(`${file}: "${key}" key present`);
    }
    // The only address allowed through is the fictional one written above.
    for (const address of content.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []) {
      if (!address.endsWith('@exemplo.com'))
        leaks.push(`${file}: email ${address}`);
    }
    // A user-scoped spotify reference would identify the listener.
    for (const marker of ['spotify:user:', '/users/']) {
      if (content.includes(marker)) leaks.push(`${file}: ${marker} reference`);
    }
  }

  if (leaks.length > 0) {
    throw new Error(`anonymisation failed:\n  ${leaks.join('\n  ')}`);
  }

  logger.log(
    `checked ${files.length} file(s): no tokens, emails or spotify ids found`,
  );
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const authService = app.get(AuthService, { strict: false });
    const dashboardService = app.get(DashboardService, { strict: false });
    const chatbotService = app.get(ChatbotService, { strict: false });
    const userService = app.get(UserService, { strict: false });
    const userModel = app.get<Model<User>>(getModelToken(User.name), {
      strict: false,
    });

    const users = await userModel.find().lean().exec();
    logger.log(`found ${users.length} user(s) in mongo`);

    await clearPreviousOutput();

    // Every real value that must not appear in the output, checked at the end.
    const forbidden = new Map<string, string>();
    let captured = 0;

    for (const [index, user] of users.entries()) {
      const spotifyId = user.spotifyId;
      const demoName = DEMO_NAMES[index % DEMO_NAMES.length];
      const id = `perfil-${index + 1}-${slugify(demoName)}`;

      forbidden.set(`spotifyId #${index + 1}`, spotifyId);
      forbidden.set(`email #${index + 1}`, user.email);
      forbidden.set(`accessToken #${index + 1}`, user.accessToken);
      forbidden.set(`refreshToken #${index + 1}`, user.refreshToken);
      if (user.displayName)
        forbidden.set(`displayName #${index + 1}`, user.displayName);

      try {
        // Fetched because it is the cheapest liveness check on the token and it
        // triggers the refresh path when needed. Nothing from it is written:
        // the whole profile is replaced by the fictional one below. The token is
        // re-read inside the closure so a retry picks up a refreshed one, the
        // same way the dashboard service does.
        await withTokenRefresh(authService, spotifyId, async () => {
          const current = await userService.findUser(spotifyId);
          return authService.getProfile(current.accessToken);
        });

        const terms: Record<string, unknown> = {};
        for (const term of TERMS) {
          const [artists, tracks] = await Promise.all([
            withTokenRefresh(authService, spotifyId, () =>
              dashboardService.getTopArtists(spotifyId, term),
            ),
            withTokenRefresh(authService, spotifyId, () =>
              dashboardService.getTopTracks(spotifyId, term),
            ),
          ]);

          terms[term] = {
            artists: strip(artists),
            tracks: strip(tracks),
            // same derivation the dashboard endpoint uses
            genres: DashboardService.computeGenres(artists),
          };
        }

        const recentlyPlayed = await withTokenRefresh(
          authService,
          spotifyId,
          () => dashboardService.getRecentlyPlayed(spotifyId),
        );

        // One real Gemini answer, recorded so demo visitors never hit the API.
        // Kept non-fatal: a chat outage should not cost us the musical capture,
        // it just leaves this profile without a recorded conversation.
        let chatResponse: Awaited<ReturnType<ChatbotService['chat']>> | null =
          null;
        try {
          chatResponse = await withTokenRefresh(authService, spotifyId, () =>
            chatbotService.chat(spotifyId, DEMO_CHAT_PROMPT),
          );
        } catch (error) {
          logger.warn(
            `no chat recorded for ${id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        const profile = {
          id,
          user: {
            displayName: demoName,
            email: `${slugify(demoName)}@exemplo.com`,
            avatarUrl: null,
          },
          terms,
          recentlyPlayed: strip(recentlyPlayed),
          chat: chatResponse && {
            basedOn: DEMO_CHAT_PROMPT.basedOn,
            message: DEMO_CHAT_PROMPT.message,
            response: strip(chatResponse),
          },
        };

        await writeFile(
          resolve(OUTPUT_DIR, `${id}.json`),
          `${JSON.stringify(profile, null, 2)}\n`,
          'utf8',
        );

        captured += 1;
        logger.log(`captured ${id}`);
      } catch (error) {
        // A user who revoked access should not abort the whole capture.
        logger.error(
          `skipped user #${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    logger.log(`wrote ${captured} profile(s) to ${OUTPUT_DIR}`);
    await assertNoSecretsLeaked(forbidden);
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  logger.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
