import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './services/users/users.module';
import { AuthModule } from './services/auth/auth.module';
import { UsersProfileModule } from './services/profiles/profiles.modules';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forRoot('mongodb://pyd-admin-123:pyd-password-123@localhost:27027/voices?authSource=admin', {
      useNewUrlParser: true,
    }),
    UsersModule,
    UsersProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
