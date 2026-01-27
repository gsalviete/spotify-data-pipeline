import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) 
  private userModel: Model<User>,
) {}

  async findOrCreate(dto: CreateUserDto): Promise<User> {
    return await this.userModel
      .findOneAndUpdate({ spotifyId: dto.spotifyId }, dto, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();
  }

  async me( spotifyId : string): Promise<ResponseUserDto> {     
    const user = await this.userModel.findOne({ spotifyId })

    if(!user){
      throw new UnauthorizedException();
    }
    
    const newUser = {
        email: user.email,
        avatarUrl: user.avatarUrl,
        displayName: user.displayName,
    }

    return newUser;
  }
}
