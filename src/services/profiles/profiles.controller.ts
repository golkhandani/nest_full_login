import { Controller, Get, Request, Headers, Post, Body, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { ParseLimitPipe } from '../../shared/pipes/limit.pipe';
import { ParseOffsetPipe } from '../../shared/pipes/offset.pipe';
import { Roles, RoleGuard } from '../../shared/guards/roles.guard';
import { UserFromHeader } from '../../shared/decorators/user.decorator';

import { User, UserRole } from '../../shared/models/users.model';
import { UsersProfileProvider } from './profiles.provider';

@Controller('users/profile')

export class UsersProfileController {
    constructor(
        private readonly usersProfileProvider: UsersProfileProvider,
    ) { }
    @UseGuards(RoleGuard)
    @Roles(UserRole.USER, UserRole.GUEST)
    @Get('me')
    async getProfile(@UserFromHeader() user): Promise<User> {
        return this.usersProfileProvider.sayHello(user);
    }
}
