import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { JwtPayload, TokenSubject } from '../models/jwtPayload.model';
import { User } from 'src/shared/models/users.model';
import { AuthProvider } from '../auth.provider';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private blocked: string[] = [];
    constructor(private readonly authProvider: AuthProvider) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
            ignoreExpiration: true,
            secretOrKey: jwtConstants.secret,
        });
    }

    /**
     * return unsign token
     * to reach this step should send a token with some requirment
     * for example structure , correct secret and valid expire time
     * @param payload JwtPayload
     */
    async validate(payload: JwtPayload) {
        const unlocked = TokenSubject.unlock(payload.sub) as User;
        if (this.blocked.includes(unlocked._id)) {
            return new HttpException('you are blocked', 403);
        }
        const user = await this.authProvider.findUserForValidation(unlocked._id);
        if (!user) {
            throw new NotFoundException();
        } else { return TokenSubject.unlock(payload.sub); }
    }
}
