import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, UserModelName } from './models/users.model';
import { UsersController } from './users.controller';
import { UsersProvider } from './users.provider';
import { UserAlreadyExist } from './validators/userAlreadyExists';
import { AuthModule } from '../auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: UserModelName, schema: UserSchema }]),
  ],
  controllers: [
    UsersController,
  ],
  providers: [
    UserAlreadyExist,
    UsersProvider,
  ],
  exports: [
    UsersProvider,
  ],
})
export class UsersModule { }
