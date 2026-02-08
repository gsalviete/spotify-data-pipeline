import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const spotifySecret = configService.getOrThrow<string>(
    'SPOTIFY_SESSION_SECRET',
  );

  app.use(
    session({
      secret: spotifySecret,
      resave: false,
      saveUninitialized: true,
      cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 10,
      sameSite: 'lax',
    },
    }),
  );

  app.enableCors({
    origin: 'http://127.0.0.1:5173',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
