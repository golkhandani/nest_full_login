import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModelName, User } from '../../shared/models/users.model';
import { CreateByUsername } from './dto/createUserByUsername';

@Injectable()
export class UsersProvider {
    constructor(@InjectModel(UserModelName) private readonly UserModel: Model<User>) {

    }
    //#region BASIC CRUD FUNCTIONS
    async createUserByUsername(user: CreateByUsername): Promise<User> {
        const newUser = new this.UserModel(user);
        return await newUser.save();
    }
    async findAllUsers(limit = 10, offset = 0): Promise<User[]> {
        return await this.UserModel.find().limit(limit).skip(offset);
    }
    //#endregion

    async findByUniquesForValidation(value: string): Promise<User> {
        return await this.UserModel.findOne({
            $or: [
                { username: value },
                { google: value },
                { email: value },
            ],
        });
    }
}
