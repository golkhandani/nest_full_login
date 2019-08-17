import { Controller, Get, Request, Headers, Post, Body, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { UsersProvider } from './users.provider';
import { CreateByUsername, CreateByEmail, CreateByPhoneCode, CreateByPhoneNumber } from './dto/createUser';
import { User, UserRole } from '../../shared/models/users.model';
import { ParseLimitPipe } from '../../shared/pipes/limit.pipe';
import { ParseOffsetPipe } from '../../shared/pipes/offset.pipe';
import { Roles, RoleGuard } from '../../shared/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthProvider } from '../auth/auth.provider';
import { UserReq } from '../../shared/decorators/user.decorator';
import { UserWithToken } from './dto/userWithToken.dto';
import { OS } from '../../shared/enums/os.enum';
import { VerificationCodeOutout } from '../auth/dto/verificationCode.dto';

export const signinTypes = {
  up: 'username-password',
  ep: 'email-password',
  go: 'google',
  pc: 'phone-code',
};

@Controller('users')

export class UsersController {
  @Get('ping')
  @UseGuards(RoleGuard)
  // @Roles(UserRole.USER)
  getPing(
    @Request() req,
    @UserReq() user): any {
    return {
      authorization: req.headers.authorization,
      user,
    };
  }
  @Post('ping')
  @UseGuards(RoleGuard)
  postPing(
    @Request() req,
    @UserReq() user): any {
    return {
      authorization: req.headers.authorization,
      user,
    };
  }
  constructor(
    private readonly usersProvider: UsersProvider,
    private readonly authProvider: AuthProvider) { }

  //#region USERNAME/PASSWORD
  @Post('signup/username')
  async createUserByUsername(@Body() user: CreateByUsername): Promise<UserWithToken> {
    return await this.authProvider.signupByUserPass(user);
  }
  @Post('signin/username')
  async loginByUsername(
    @Body('username') username,
    @Body('password') password): Promise<UserWithToken> {
    return await this.authProvider.signinByUserPass(username, password);
  }
  //#endregion
  //#region EMAIL/PASSWORD
  @Post('signup/email')
  async createUserByEmail(@Body() user: CreateByEmail): Promise<UserWithToken> {
    return await this.authProvider.signupByEmailPass(user);
  }
  @Post('signin/email')
  async loginByEmail(
    @Body('email') email,
    @Body('password') password): Promise<UserWithToken> {
    return await this.authProvider.signinByEmailPass(email, password);
  }
  //#endregion
  //#region PHONE/CODE
  @Post('signup/phone')
  async getPhoneSendCode(@Body() body: CreateByPhoneNumber): Promise<VerificationCodeOutout> {
    return await this.authProvider.signinByPhoneNumber(body.phone);
  }
  @Post('signin/phone')
  async get(
    @Body() body: CreateByPhoneCode): Promise<UserWithToken> {
    return await this.authProvider.signinByPhoneCode(body.phone, body.code);
  }
  //#endregion
  //#region GOOGLE
  @Post('signin/google')
  async createGoogleUser(
    @Body('gat') googleAccessToken: string,
    @Body('dp') devicePlatform: OS,
  ): Promise<UserWithToken> {
    return await this.authProvider.signinByGoogle(googleAccessToken, devicePlatform);
  }
  //#endregion

  @Post('refresh')
  async refresh(
    @Headers('authorization') accessToken: string,
    @Body('refreshToken') refreshToken: string): Promise<any> {
    return await this.authProvider.refreshAccessToken(refreshToken);
  }

  @Get()
  async findAllUsers(
    @Query('limit', new ParseLimitPipe()) limit,
    @Query('offset', new ParseOffsetPipe()) offset,
  ): Promise<User[]> {
    return await this.usersProvider.findAllUsers(limit, offset);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

}
