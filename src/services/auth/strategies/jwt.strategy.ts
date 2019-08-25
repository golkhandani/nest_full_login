import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, HttpException } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../models/jwtPayload.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private blocked: string[] = [];
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
            ignoreExpiration: true,
            secretOrKey: jwtConstants.public_key,
        });
    }

    /**
     * return unsign token
     * to reach this step should send a token with some requirment
     * for example structure , correct secret and valid expire time
     * @param payload JwtPayload
     */
    async validate(payload: JwtPayload) {
        // const unlocked = TokenSubject.unlock(payload.sub) as User;
        if (this.blocked.includes(payload._id)) {
            return new HttpException('you are blocked', 403);
        } else { return payload; }
    }
}
