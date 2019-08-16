import { Module } from '@nestjs/common';
import { AuthProvider } from './auth.provider';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { MongooseModule } from '@nestjs/mongoose';
import { UserBridgeModelName, UserBridgeSchema } from './models/userBridge.model';
import { RefreshTokenModelName, RefreshTokenSchema } from './models/refreshToken.model';

@Module({
    imports: [
        // UsersModule,
        MongooseModule.forFeature([{ name: UserBridgeModelName, schema: UserBridgeSchema }]),
        MongooseModule.forFeature([{ name: RefreshTokenModelName, schema: RefreshTokenSchema }]),
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '60s' },
        }),
    ],
    providers: [AuthProvider, LocalStrategy, JwtStrategy],
    exports: [AuthProvider],
})
export class AuthModule { }
