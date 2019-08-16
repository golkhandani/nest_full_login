import { Controller, Get, Request, Headers, Post, Body, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { UsersProvider } from './users.provider';
import { CreateByUsername, CreateByEmail } from './dto/createUser';
import { User, UserRole } from './models/users.model';
import { ParseLimitPipe } from '../../shared/pipes/limit.pipe';
import { ParseOffsetPipe } from '../../shared/pipes/offset.pipe';
import { Roles, RoleGuard } from '../../shared/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthProvider } from '../auth/auth.provider';
import { UserReq } from '../../shared/decorators/user.decorator';
import { UserWithToken } from './dto/userWithToken.dto';
import { OS } from '../../shared/enums/os.enum';

export const signinTypes = {
  up: 'username-password',
  go: 'google',
  ph: 'phone',
};

@Controller('users')
@UseGuards(RoleGuard)
export class UsersController {
  @Get('ping')
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

  @Post('signin/google')
  async createGoogleUser(
    @Body('gat') googleAccessToken: string,
    @Body('dp') devicePlatform: OS,
  ): Promise<UserWithToken> {
    return await this.authProvider.signinByGoogle(googleAccessToken, devicePlatform);
  }

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
