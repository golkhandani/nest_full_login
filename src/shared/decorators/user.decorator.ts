import { createParamDecorator } from '@nestjs/common';
import { User } from '../models/users.model';
export const UserFromHeader = createParamDecorator((data: string, req): User => {
    return data ? req.user && req.user[data] : req.user;
});
