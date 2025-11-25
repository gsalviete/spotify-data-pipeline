import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOrCreate(dto: CreateUserDto): Promise<User> {
    return await this.userModel
      .findOneAndUpdate({ spotifyId: dto.spotifyId }, dto, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();
  }
}
