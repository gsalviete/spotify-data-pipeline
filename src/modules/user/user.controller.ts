import { Controller, Get, Session, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/session-auth.guard';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ){}

    @Get('me')
    @UseGuards(SessionAuthGuard)
    async me(@Session() session: Record<string, any>){
        const userId = session.userId;
        
        return await this.userService.me(userId);
    }

    @Get()
    async findUser(@Session() session: Record<string, any>){
        const userId = session.userId;
        return await this.userService.findUser(userId);
    }
}
