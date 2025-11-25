import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-spotify';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('SPOTIFY_CLIENT_ID')!,
      clientSecret: configService.get<string>('SPOTIFY_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('SPOTIFY_CALLBACK_URL')!,
      scope: [
        'user-read-private',
        'user-read-email',
        'playlist-modify-private',
        'playlist-read-collaborative',
      ],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    const user = {
      spotifyId: profile.id,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0] ?? null,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    return user;
  }
}
