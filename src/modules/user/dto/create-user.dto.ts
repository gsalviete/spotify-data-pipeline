import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    spotifyId: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    acessToken: string;

    @IsString()
    @IsNotEmpty()
    refreshToken: string;

    @IsString()
    avatarUrl?: string;
}