import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SpotifyStrategy } from './strategies/spotify.strategy';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PassportModule, UserModule, HttpModule],
  controllers: [AuthController],
  providers: [AuthService, SpotifyStrategy],
})
export class AuthModule {}
