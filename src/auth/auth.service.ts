import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/user.service';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async signIn(username: string, password: string): Promise<any> {
}}

