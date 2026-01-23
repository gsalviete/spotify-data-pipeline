import { Injectable, NotAcceptableException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { CallbackDto } from './dto/callback-dto';
import session from 'express-session';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
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
    if(dto.state != session.oauthState){
      throw new NotAcceptableException('State not matches with Code')
    }

    
  }
}
