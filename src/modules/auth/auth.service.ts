import { Injectable, NotAcceptableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallbackDto } from './dto/callback-dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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
    if (dto.state != session.oauthState) {
      throw new NotAcceptableException('State not matches with Code');
    }
    
    return this.exchangeCodeForToken(dto);
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

  async getProfile(dto: CreateUserDto) {
    const accessToken = dto.accessToken;

    const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  const data = await response.json();
  return data; 
  }
}
