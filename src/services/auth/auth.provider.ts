import { Injectable, HttpException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenSubject } from './models/jwtPayload.model';
import { UserBridgeModelName, UserBridge } from './models/userBridge.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/models/users.model';
import { RefreshTokenModelName, RefreshToken } from './models/refreshToken.model';
import { jwtConstants } from './constants';
import * as moment from 'moment';
import * as base64 from 'base-64';
import { UserWithToken } from '../users/dto/userWithToken.dto';
import { OS } from '../../shared/enums/os.enum';
import { Google } from './helpers/googleAuth.helper';

@Injectable()
export class AuthProvider {
    constructor(
        @InjectModel(UserBridgeModelName) private readonly UserBridgeModel: Model<UserBridge>,
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
        return await this.UserBridgeModel.findById(id);
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
    private async createTokenResponse(userObj: User) {
        const user = {
            _id: userObj._id,
            username: userObj.username,
            name: userObj.name,
            email: userObj.email,
            role: userObj.role || 'ADMIN',
        } as User;
        const payload = {
            sub: TokenSubject.lock(user),
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.createRefreshToken(user);
        return { user, refreshToken, accessToken };
    }
    public async refreshAccessToken(oldRefreshToken: string): Promise<any> {
        const refreshTokenObj = await this.RefreshTokenModel.findOne({ token: oldRefreshToken });
        if (!refreshTokenObj) {
            throw new ForbiddenException();
        }
        const userObj: User = await this.UserBridgeModel.findById(refreshTokenObj.user) as User;
        if (!userObj) {
            throw new HttpException('invalid token', 400);
        }
        const { user, refreshToken, accessToken } = await this.createTokenResponse(userObj);
        return {
            user,
            refreshToken,
            accessToken,
        };
    }

    //#region SIGN UP/IN
    public async signupByUserPass(userObj: any): Promise<UserWithToken> {
        const newUser = new this.UserBridgeModel(userObj);
        const savedUser = await newUser.save() as User;
        const { user, refreshToken, accessToken } = await this.createTokenResponse(savedUser);
        return {
            user,
            refreshToken,
            accessToken,
        };
    }
    public async signinByUserPass(username: string, password: string): Promise<UserWithToken> {
        const userObj: User = await this.UserBridgeModel.findOne({ username }) as User;
        if (!userObj) {
            throw new HttpException('user not found', 404);
        } else if (userObj.password !== password) {
            throw new HttpException('invalid password', 400);
        } else {

            const { user, refreshToken, accessToken } = await this.createTokenResponse(userObj);
            return {
                user,
                refreshToken,
                accessToken,
            };
        }
    }

    public async signupByEmailPass(userObj: any): Promise<UserWithToken> {
        const newUser = new this.UserBridgeModel(userObj);
        const savedUser = await newUser.save() as User;
        const { user, refreshToken, accessToken } = await this.createTokenResponse(savedUser);
        return {
            user,
            refreshToken,
            accessToken,
        };
    }
    public async signinByEmailPass(email: string, password: string): Promise<UserWithToken> {
        const userObj: User = await this.UserBridgeModel.findOne({ email }) as User;
        if (!userObj) {
            throw new HttpException('user not found', 404);
        } else if (userObj.password !== password) {
            throw new HttpException('invalid password', 400);
        } else {

            const { user, refreshToken, accessToken } = await this.createTokenResponse(userObj);
            return {
                user,
                refreshToken,
                accessToken,
            };
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
            const existsUser = await this.UserBridgeModel.findOne({
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
                const newUser = new this.UserBridgeModel(googleUser);
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
