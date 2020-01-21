import { User } from '@shared/models/users.model';

export class UserWithToken {
    user: User;
    refreshToken: string;
    accessToken: string;
    tokenType: string;
}
