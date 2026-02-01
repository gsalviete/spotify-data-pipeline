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
      private readonly userService: UserService){}
      
  async getTopArtists(userId: string) {
    const user = await this.userService.findUser(userId);
   
    const response = await firstValueFrom(
      this.httpService.get(
        'https://api.spotify.com/v1/me/top/artists',
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
          params: {
            time_range: 'medium_term',
            limit: 20,
            offset: 0
          }
        },
      ),
    );
    return response.data;
  }
}
