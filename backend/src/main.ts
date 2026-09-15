import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { MongoStore } from 'connect-mongo';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const spotifySecret = configService.getOrThrow<string>(
    'SPOTIFY_SESSION_SECRET',
  );
  const frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');
  const mongoUri = configService.getOrThrow<string>('MONGODB_URI');
  const isProduction = configService.get<string>('NODE_ENV') === 'prod';

  // TEMPORARY (remove once the production 401 is diagnosed): prints the cookie
  // configuration this process actually resolved at boot. An unset NODE_ENV
  // silently validates to 'dev', which downgrades the cookie to SameSite=Lax.
  console.log(
    '[TEMP][boot] NODE_ENV=%j isProduction=%s cookie.secure=%s cookie.sameSite=%s frontendUrl=%j',
    configService.get<string>('NODE_ENV'),
    isProduction,
    isProduction,
    isProduction ? 'none' : 'lax',
    frontendUrl,
  );

  if (isProduction) {
    // Render terminates TLS on a proxy, so without this express sees a plain
    // http request and refuses to send the `secure` cookie.
    app.set('trust proxy', 1);
  }

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.use(
    session({
      secret: spotifySecret,
      resave: false,
      // /auth/login calls session.save() before redirecting, so the oauth flow
      // still gets a persisted session — visitors without login store nothing.
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: mongoUri }),
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 8,
        // frontend and backend live on different domains in production
        sameSite: isProduction ? 'none' : 'lax',
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
