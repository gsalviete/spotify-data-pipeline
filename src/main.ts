import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const configService = app.get(ConfigService);
  const spotifySecret = configService.get<string>('SPOTIFY_SESSION_SECRET');

  if (!spotifySecret) {
    throw new UnauthorizedException();
  }
  {
    app.use(
      session({
        secret: spotifySecret,
        resave: false,
        saveUninitialized: false,
      }),
    );
  }
}

void bootstrap();
