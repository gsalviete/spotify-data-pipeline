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
    private readonly userService: UserService,
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
      scope: 'user-read-email user-read-private user-top-read',
      state,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async callback(session: Record<string, any>, dto: CallbackDto) {
    if (dto.state != session.oauthState) {
      throw new NotAcceptableException('State not matches with Code');
    }

    const tokens = await this.exchangeCodeForToken(dto);
    const user = await this.loginWithSpotify(
      tokens.access_token,
      tokens.refresh_token,
    );

    session.userId = user.spotifyId;

    return user;
  }

  async exchangeCodeForToken(dto: CallbackDto) {
    const redirectUri = this.configService.getOrThrow<string>(
      'SPOTIFY_REDIRECT_URI',
    );
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code: dto.code,
      redirect_uri: redirectUri,
    });

    const spotifySecret = this.configService.getOrThrow<string>(
      'SPOTIFY_CLIENT_SECRET',
    );
    const spotifyId =
      this.configService.getOrThrow<string>('SPOTIFY_CLIENT_ID');
    const response = await firstValueFrom(
      this.httpService.post(
        'https://accounts.spotify.com/api/token',
        data.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
              'Basic ' +
              Buffer.from(`${spotifyId}:${spotifySecret}`).toString('base64'),
          },
        },
      ),
    );
    return response.data;
  }

  async getProfile(accessToken: string) {
    const response = await firstValueFrom(
      this.httpService.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      }),
    );

    const data = await response.data;
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

  async refreshAccessToken(spotifyId: string) {
    const spotifySecret = this.configService.getOrThrow<string>(
      'SPOTIFY_CLIENT_SECRET',
    );
    const clientId = this.configService.getOrThrow<string>('SPOTIFY_CLIENT_ID');
    const user = await this.userService.findUser(spotifyId);

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    });
    const response = await firstValueFrom(
      this.httpService.post(
        'https://accounts.spotify.com/api/token',
        data.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
              'Basic ' +
              Buffer.from(`${clientId}:${spotifySecret}`).toString('base64'),
          },
        },
      ),
    );
    await this.userService.updateTokens(spotifyId, {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token ?? user.refreshToken,
    });

    return response.data;
  }
}
