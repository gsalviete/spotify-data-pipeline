import { Controller, Get, Query, Redirect, Res, Session } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CallbackDto } from './dto/callback-dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Redirect()
  async login(@Session() session: Record<string, any>) {
    const url = await this.authService.login(session);

    await new Promise<void>((resolve, reject) => {
      session.save((err: any) => {
        if (err) reject(err);
        resolve();
      });
    });

    return { url, statusCode: 302 };
  }

  @Get('callback')
  async callback(
    @Session() session: Record<string, any>,
    @Query() dto: CallbackDto,
    @Res() res: Response,
  ) {
    await this.authService.callback(session, dto);
    res.redirect('http://127.0.0.1:5173/dashboard');
  }
}
