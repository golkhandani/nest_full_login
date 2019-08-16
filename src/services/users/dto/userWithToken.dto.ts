import { User } from '../models/users.model';

export class UserWithToken {
    user: User;
    refreshToken: string;
    accessToken: string;
}
