
import { Controller, Get, Put, Request, Headers, Post, Body, Query, UseGuards, SetMetadata, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor, MulterModule, MulterModuleOptions, MulterModuleAsyncOptions } from '@nestjs/platform-express';

import { ParseLimitPipe } from '../../shared/pipes/limit.pipe';
import { ParseOffsetPipe } from '../../shared/pipes/offset.pipe';
import { Roles, RoleGuard } from '../../shared/guards/roles.guard';
import { UserFromHeader } from '../../shared/decorators/user.decorator';

import { User, UserRole } from '../../shared/models/users.model';
import { UsersProfileProvider } from './profiles.provider';
import { fsMakeDirIfNotExists } from '../../shared/helpers/fs.helper';

import * as multer from 'multer'
import { MulterFile } from '../../shared/dtos/file.dto';

const temp_folder: string = `./temp/users/pictures`;
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        await fsMakeDirIfNotExists(temp_folder);
        cb(null, temp_folder);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "__" + file.originalname);
    }
});

const multerOptions: MulterModuleOptions = {
    storage: storage,
};

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

    @Put('me/picture')
    @UseInterceptors(FileInterceptor('file', multerOptions))
    async updateProfile(@UploadedFile() file: MulterFile) {
        return file
    }
}
