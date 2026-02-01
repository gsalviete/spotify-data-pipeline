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
      

}
