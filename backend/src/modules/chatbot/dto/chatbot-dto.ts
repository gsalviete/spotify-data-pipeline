import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';

export enum RecommendationType {
  ALBUM  = 'album',
  ARTIST = 'artist',
  MUSIC  = 'music',
}

export class ChatbotDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RecommendationType, { each: true })
  basedOn: RecommendationType[];
}
