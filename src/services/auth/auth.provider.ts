import { Injectable, HttpException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenSubject } from './models/jwtPayload.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserModelName } from '../../shared/models/users.model';
import { RefreshTokenModelName, RefreshToken } from './models/refreshToken.model';
import { jwtConstants, phoneConstants } from './constants';
import * as moment from 'moment';
import * as base64 from 'base-64';
import { UserWithToken } from '../users/dto/userWithToken.dto';
import { OS } from '../../shared/enums/os.enum';
import { Google } from './helpers/googleAuth.helper';
import { PhoneVerification, PhoneVerificationModelName } from './models/phoneVerification.model';
import { PhoneVerfication } from './helpers/phoneAuth.helper';
import { VerificationCodeOutout } from './dto/verificationCode.dto';

@Injectable()
export class AuthProvider {
    constructor(
        @InjectModel(UserModelName) private readonly UserModel: Model<User>,
        @InjectModel(PhoneVerificationModelName) private readonly PhoneVerificationModel: Model<PhoneVerification>,
        @InjectModel(RefreshTokenModelName) private readonly RefreshTokenModel: Model<RefreshToken>,
        private readonly jwtService: JwtService,
    ) { }

    public async validateUser(username: string, pass: string): Promise<any> {
        // const user = await this.usersProvider.findByUsernameForValidation(username);
        // if (user && user.password === pass) {
        //     const { password, ...result } = user;
        //     return result;
        // }
        // return null;
    }
    public async findUserForValidation(id) {
        return await this.UserModel.findById(id);
    }
    private async createRefreshToken(safeUser: User): Promise<string> {
        await this.RefreshTokenModel.deleteOne({ user: safeUser._id });
        const expires = moment().add(jwtConstants.expirationInterval, 'days').toDate();
        const token = base64.encode(Math.random() + safeUser._id + Math.random());
        const newRefreshToken = new this.RefreshTokenModel({
            token,
            user: safeUser._id,
            expires,
        });
        await newRefreshToken.save();
        return token;
    }
    private createAccessToken(payload) {
        return this.jwtService.sign(payload, {
            subject: TokenSubject.lock(payload),
            algorithm: jwtConstants.algorithm,
            issuer: 'auth.com',
            audience: 'service.com',
            expiresIn: jwtConstants.expiresIn,

        });
    }
    private async createTokenResponse(userObj: User) {
        const user = {
            _id: userObj._id,
            // username: userObj.username,
            // name: userObj.name,
            // email: userObj.email,
            role: userObj.role || 'ADMIN',
        } as User;
        const payload = user;
        const accessToken = this.createAccessToken(payload);
        const refreshToken = await this.createRefreshToken(user);
        const tokenType = 'Bearer';
        return { user, tokenType, refreshToken, accessToken };
    }
    public async refreshAccessToken(oldRefreshToken: string): Promise<any> {
        const refreshTokenObj = await this.RefreshTokenModel.findOne({ token: oldRefreshToken });
        if (!refreshTokenObj) {
            throw new ForbiddenException();
        }
        const userObj: User = await this.UserModel.findById(refreshTokenObj.user) as User;
        if (!userObj) {
            throw new HttpException('invalid token', 400);
        }
        return await this.createTokenResponse(userObj);
    }

    //#region SIGN UP/IN
    public async signupByUserPass(userObj: any): Promise<UserWithToken> {
        const newUser = new this.UserModel(userObj);
        const savedUser = await newUser.save() as User;
        return await this.createTokenResponse(savedUser);
    }
    public async signinByUserPass(username: string, password: string): Promise<UserWithToken> {
        const userObj: User = await this.UserModel.findOne({ username }) as User;
        if (!userObj) {
            throw new HttpException('user not found', 404);
        } else if (userObj.password !== password) {
            throw new HttpException('invalid password', 400);
        } else {
            return await this.createTokenResponse(userObj);
        }
    }

    public async signupByEmailPass(userObj: any): Promise<UserWithToken> {
        const newUser = new this.UserModel(userObj);
        const savedUser = await newUser.save() as User;
        return await this.createTokenResponse(savedUser);
    }
    public async signinByEmailPass(email: string, password: string): Promise<UserWithToken> {
        const userObj: User = await this.UserModel.findOne({ email }) as User;
        if (!userObj) {
            throw new HttpException('user not found', 404);
        } else if (userObj.password !== password) {
            throw new HttpException('invalid password', 400);
        } else {
            return await this.createTokenResponse(userObj);
        }
    }
    /**
     * Step 1 / 4
     * get phone number and create verfication code
     * we will use verfication code to complete signup
     * @param phone string
     */
    public async signinByPhoneNumber(phone: string): Promise<VerificationCodeOutout> {
        const rm = await this.PhoneVerificationModel.findOneAndDelete({ phone });
        const { code, codeLength, codeType } = PhoneVerfication.randomCode;
        const expires = moment().add(phoneConstants.expirationInterval, 'minutes').toDate();
        const newVerification = new this.PhoneVerificationModel({
            code,
            expires,
            phone,
            codeType,
        });
        const savedVerification = await newVerification.save();
        // TODO turned off for development
        //  const sms = await PhoneVerfication.sendSmsByKavenegar(phone, code);
        return {
            codeLength,
            expires,
        };
    }
    public async signinByPhoneCode(phone: string, code: string): Promise<UserWithToken> {
        const phoneVerfication = await this.PhoneVerificationModel
            .findOne({ phone });
        if (!phoneVerfication) {
            throw new ForbiddenException();
        } else if (moment(phoneVerfication.expires).isBefore(Date.now())) {
            throw new HttpException('your code is expired try to send phone number again', 400);
        } else if (phoneVerfication.code === code) {
            const rm = await this.PhoneVerificationModel.findOneAndDelete({ phone });
            const newUser = new this.UserModel({
                phone,
            });
            const savedUser = await newUser.save() as User;
            const { user, refreshToken, accessToken } = await this.createTokenResponse(savedUser);
            return {
                user,
                refreshToken,
                accessToken,
            };
        } else {
            throw new HttpException('invalid code', 400);
        }
    }

    public async signinByGoogle(
        googleAccessToken: string,
        os: OS,
    ): Promise<UserWithToken> {

        const google = new Google(os, googleAccessToken);
        const googleUser = await google.getUserInfo();

        // google account is found Or not so
        if (googleUser) {
            const existsUser = await this.UserModel.findOne({
                $or: [
                    { google: googleUser.google },
                    { gmail: googleUser.google },
                ],
            }) as User;
            /**
             * if existsUser is null
             * we should create new user
             * if userWithGoogle or userWithGmail return true
             * we just have to update record
             */

            const userWithGoogle = existsUser && existsUser.google === googleUser.google;
            const userWithVerifiedGmail = existsUser && existsUser.email === googleUser.google && existsUser.email_verified;
            if (!existsUser) {
                const newUser = new this.UserModel(googleUser);
                const savedUser = await newUser.save() as User;
                const { user, refreshToken, accessToken } = await this.createTokenResponse(savedUser);
                return {
                    user,
                    refreshToken,
                    accessToken,
                };

            } else if (userWithGoogle) {
                const { user, refreshToken, accessToken } = await this.createTokenResponse(existsUser);
                return {
                    user,
                    refreshToken,
                    accessToken,
                };
            } else if (userWithVerifiedGmail) {
                const { user, refreshToken, accessToken } = await this.createTokenResponse(existsUser);
                return {
                    user,
                    refreshToken,
                    accessToken,
                };
            } else {
                throw new HttpException(`
                gmail already exist but not verified plz verify it first
                if its not yours contanct support`
                    , 400);
            }

        } else {
            throw new HttpException('google user not found', 404);
        }

    }
}
