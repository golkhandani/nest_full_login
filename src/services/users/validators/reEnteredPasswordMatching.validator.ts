import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersProvider } from '../users.provider';

@ValidatorConstraint({ name: 'isUserAlreadyExist', async: true })
@Injectable()
export class UserAlreadyExist implements ValidatorConstraintInterface {
    constructor(protected readonly usersProvider: UsersProvider) { }

    async validate(text: string) {
        const user = await this.usersProvider.findByUniquesForValidation(text);
        return !user;
    }
}
