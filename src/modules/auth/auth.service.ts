import { Injectable, NotAcceptableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallbackDto } from './dto/callback-dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly userService: UserService
  ) {}

  async login(session: Record<string, any>) {
    const state = crypto.randomUUID();
    session.oauthState = state;

    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const redirectUri = this.configService.get<string>('SPOTIFY_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new Error('Missing environment variable');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'user-read-email user-read-private',
      state,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async callback(session: Record<string, any>, dto: CallbackDto) {
    console.log('session no callback:', session);
    console.log('state do dto:', dto.state);
    console.log('state da session:', session.oauthState);
  

    if (dto.state != session.oauthState) {
      throw new NotAcceptableException('State not matches with Code');
    }
    
    const tokens = await this.exchangeCodeForToken(dto);
    console.log('tokens recebidos', tokens);

    const user = await this.loginWithSpotify(tokens.access_token, tokens.refresh_token);
    console.log('user criado', user);

    session.userId = user.spotifyId;

    return user;
  }

  async exchangeCodeForToken(dto: CallbackDto) {
    const redirectUri = this.configService.getOrThrow<string>('SPOTIFY_REDIRECT_URI');
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code: dto.code,
      redirect_uri: redirectUri
    });

    const spotifySecret = this.configService.getOrThrow<string>('SPOTIFY_CLIENT_SECRET');
    const spotifyId = this.configService.getOrThrow<string>('SPOTIFY_CLIENT_ID')
    const response = await firstValueFrom(
      this.httpService.post(
        'https://accounts.spotify.com/api/token',
        data.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
              'Basic ' +
              Buffer.from(
                `${spotifyId}:${spotifySecret}`,
              ).toString('base64'),
          },
        },
      ),
    );

    return response.data;
  }

  async getProfile(accessToken: string) {
    const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  const data = await response.json();
  return data; 
  }

  async loginWithSpotify(accessToken: string, refreshToken: string) {
    const profile = await this.getProfile(accessToken);

    const user = await this.userService.findOrCreate({
      spotifyId: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      avatarUrl: profile.images?.[0]?.url,
      accessToken,
      refreshToken,
    });

    return user;
  }
}
