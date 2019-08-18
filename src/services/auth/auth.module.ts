import { Module } from '@nestjs/common';
import { AuthProvider } from './auth.provider';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshTokenModelName, RefreshTokenSchema } from './models/refreshToken.model';
import { PhoneVerificationModelName, PhoneVerificationSchema } from './models/phoneVerification.model';
import { UserModelName, UserSchema } from '../../shared/models/users.model';

@Module({
    imports: [
        // UsersModule,
        MongooseModule.forFeature([{ name: UserModelName, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: RefreshTokenModelName, schema: RefreshTokenSchema }]),
        MongooseModule.forFeature([{ name: PhoneVerificationModelName, schema: PhoneVerificationSchema }]),
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.private_key,
        }),
    ],
    providers: [AuthProvider, LocalStrategy, JwtStrategy],
    exports: [AuthProvider],
})
export class AuthModule { }
