import { Controller, Get, Query, Res, Session, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { CallbackDto } from './dto/callback-dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('login')
  async login(@Session() session: Record<string, any>, @Res() res: Response) {
    const url = await this.authService.login(session);

    session.save((err: any) => {
      if (err) throw err;
      res.redirect(url);
    });
  }

  @Get('callback')
  async callback(
    @Session() session: Record<string, any>,
    @Query() dto: CallbackDto,
    @Res() res: Response,
  ) {
    await this.authService.callback(session, dto);
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/dashboard`);
  }

  @Post('logout')
  async logout(
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    session.destroy((err: any) => {
      if (err) {
        res.status(500).json({ message: 'Failed to logout' });
        return;
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out' });
    });
  }
}
