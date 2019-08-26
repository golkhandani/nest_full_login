import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModelName, User } from '../../shared/models/users.model';
import { Model } from 'mongoose';

@Injectable()
export class UsersProfileProvider {
    constructor(@InjectModel(UserModelName) private readonly UserModel: Model<User>) {

    }
    async sayHello(user: User): Promise<User> {
        const eu = await this.UserModel.findById(user._id);
        return eu;
    }
}
