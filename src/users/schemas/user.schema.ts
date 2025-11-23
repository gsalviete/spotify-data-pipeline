import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, index: true })
    spotifyId: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop()
    displayName: string;

    @Prop()
    avatarUrl: string;

    @Prop({ required: true })
    acessToken: string;

    @Prop({ required: true})
    refreshToken: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastFullSyncAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);