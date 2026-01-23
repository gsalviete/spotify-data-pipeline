import { Controller, Get, Redirect, Session } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}
  

  @Get('login')
  @Redirect()
  async login(@Session() session: Record<string, any>){
    const url = await this.authService.login(session);
    return { url, statusCode: 302};
  }

  @Get('callback')
  async callback(){
    
  }

}
