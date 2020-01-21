import { Module } from '@nestjs/common';
import { UsersProfileController } from './profiles.controller';
import { UsersProfileProvider } from './profiles.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModelName, UserSchema } from '@shared/models/users.model';
@Module({
    imports: [
        MongooseModule.forFeature([{ name: UserModelName, schema: UserSchema }]),
    ],
    controllers: [UsersProfileController],
    providers: [UsersProfileProvider],
})
export class UsersProfileModule { }
