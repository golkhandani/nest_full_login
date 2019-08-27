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
    MongooseModule.forRoot('mongodb://admin:password@localhost:27027/test?authSource=admin', {
      useNewUrlParser: true,
    }),
    UsersModule,
    UsersProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
