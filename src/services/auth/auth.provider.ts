import { Injectable, HttpException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenSubject, JwtPayload } from './models/jwtPayload.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserModelName, UserRole } from '../../shared/models/users.model';
import { RefreshTokenModelName, RefreshToken } from './models/refreshToken.model';
import { jwtConstants, phoneConstants, bcryptConstants } from './constants';
import * as moment from 'moment';
import * as base64 from 'base-64';
import { UserWithToken } from '../users/dto/userWithToken.dto';
import { OS } from '../../shared/enums/os.enum';
import { Google } from './helpers/googleAuth.helper';
import { PhoneVerification, PhoneVerificationModelName } from './models/phoneVerification.model';
import { PhoneVerfication } from './helpers/phoneAuth.helper';
import { VerificationCodeOutout } from './dto/verificationCode.dto';
import { CreateByUsername, CreateGuestUser } from '../users/dto/createUserByUsername';
import { hashSync, genSaltSync, compareSync } from 'bcrypt';

@Injectable()
export class AuthProvider {
    constructor(
        @InjectModel(UserModelName) private readonly UserModel: Model<User>,
        @InjectModel(PhoneVerificationModelName) private readonly PhoneVerificationModel: Model<PhoneVerification>,
        @InjectModel(RefreshTokenModelName) private readonly RefreshTokenModel: Model<RefreshToken>,
        private readonly jwtService: JwtService,
    ) { }

    public async findUserForValidation(id: string): Promise<User> {
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
    private createAccessToken(payload: User): string {
        return this.jwtService.sign(payload, {
            subject: TokenSubject.lock(payload),
            algorithm: jwtConstants.algorithm,
            issuer: 'auth.com',
            audience: 'service.com',
            expiresIn: jwtConstants.expiresIn,

        });
    }
    private async createTokenResponse(userObj: User): Promise<UserWithToken> {
        const user = {
            _id: userObj._id,
            role: userObj.role || UserRole.GUEST,
        } as User;
        const payload = user;
        const accessToken = this.createAccessToken(payload);
        const refreshToken = await this.createRefreshToken(user);
        const tokenType = 'Bearer';
        return { user, tokenType, refreshToken, accessToken };
    }
    private async validatedUser(userObj: User, password: string) {
        if (!userObj) {
            throw new HttpException('user not found', 404);
        } else if (!compareSync(password, userObj.password)) {
            throw new HttpException('invalid password', 400);
        } else {
            return await this.createTokenResponse(userObj);
        }
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
    private generatedHashPassword(password: string): string {
        const salt = genSaltSync(bcryptConstants.saltRounds);
        const hashed = hashSync(password, salt);
        return hashed;
    }
    //#region SIGN UP/IN
    public async signAsGuest(headers: any): Promise<UserWithToken> {
        // TODO : change the way you get real fingerprint
        const fingerprint: string = headers.fingerprint || base64.encode(JSON.stringify(headers));
        const existsUser: User = await this.UserModel.findOne({ fingerprint });
        if (!existsUser) {
            const userObj = {
                fingerprint,
                role: UserRole.GUEST,
            };
            const newUser = new this.UserModel(userObj);
            const savedUser = await newUser.save() as User;
            return await this.createTokenResponse(savedUser);
        } else {
            return await this.createTokenResponse(existsUser);
        }
    }

    public async signupByUserPass(userObj: CreateByUsername): Promise<UserWithToken> {
        userObj.password = this.generatedHashPassword(userObj.password);
        const newUser = new this.UserModel(userObj);
        const savedUser = await newUser.save() as User;
        return await this.createTokenResponse(savedUser);
    }
    public async signinByUserPass(username: string, password: string): Promise<UserWithToken> {
        const userObj: User = await this.UserModel.findOne({ username }) as User;
        return this.validatedUser(userObj, password);
    }

    public async signupByEmailPass(userObj: any): Promise<UserWithToken> {
        userObj.password = this.generatedHashPassword(userObj.password);
        const newUser = new this.UserModel(userObj);
        const savedUser = await newUser.save() as User;
        return await this.createTokenResponse(savedUser);
    }
    public async signinByEmailPass(email: string, password: string): Promise<UserWithToken> {
        const userObj: User = await this.UserModel.findOne({ email }) as User;
        return this.validatedUser(userObj, password);
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
            codeType,
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
            return await this.createTokenResponse(savedUser);

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
                return await this.createTokenResponse(savedUser);

            } else if (userWithGoogle) {
                return await this.createTokenResponse(existsUser);
            } else if (userWithVerifiedGmail) {
                return await this.createTokenResponse(existsUser);
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
