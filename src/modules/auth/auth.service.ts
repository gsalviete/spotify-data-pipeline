import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { config } from 'dotenv';

config();

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async login() {
    const state = crypto.randomUUID();

    if(!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REDIRECT_URI){
      throw new Error('Missing environment variable');
    }

    const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: 'user-read-email user-read-private',
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }
}
