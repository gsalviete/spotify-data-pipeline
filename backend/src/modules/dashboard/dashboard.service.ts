import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DashboardService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly userService: UserService,
  ) {}

  async getTopArtists(userId: string) {
    const user = await this.userService.findUser(userId);

    const response = await firstValueFrom(
      this.httpService.get('https://api.spotify.com/v1/me/top/artists', {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        params: {
          time_range: 'medium_term',
          limit: 20,
          offset: 0,
        },
      }),
    );
    return response.data.items;
  }

  async getTopTracks(userId: string) {
    const user = await this.userService.findUser(userId);

    const response = await firstValueFrom(
      this.httpService.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        params: {
          time_range: 'medium_term',
          limit: 20,
          offset: 0,
        },
      }),
    );
    return response.data.items;
  }

  async getTopGenres(userId: string) {
    const artists = await this.getTopArtists(userId);

    const genreCount: Record<string, number> = {};

    for (const artist of artists) {
      for (const genre of artist.genres) {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      }
    }

    const sortedGenres = Object.entries(genreCount)
      .map(([genre, count]) => ({
        genre,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return sortedGenres;
  }

  async getRecentlyPlayed(userId: string ){
    const user = await this.userService.findUser(userId);
    const response = await firstValueFrom(
      this.httpService.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        params: {
          limit: 20,
        },
      }),
    );
    return response.data.items;
  }
}
