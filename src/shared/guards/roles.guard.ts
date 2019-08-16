
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/services/users/models/users.model';
import { AuthGuard } from '@nestjs/passport';

/**
 * decorator for role base authentication
 * @param roles USER_ROLES
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user as User;
        if (!user || !user.role) {
            throw new UnauthorizedException();
        }

        const hasRole = () => roles.includes(user.role); // user.role.some((role) => roles.includes(role));

        return user && user.role && hasRole();
    }
}

// tslint:disable-next-line: max-classes-per-file
@Injectable()
export class RoleGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        await super.canActivate(context);
        /**
         * retrun True if no role provided
         */
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }
        /**
         * retrun false if no user(token) provided
         */
        const request = context.switchToHttp().getRequest();
        const user = request.user as User;
        if (!user || !user.role) {
            throw new UnauthorizedException();
        }

        const hasRole = () => roles.includes(user.role);
        // user.role.some((role) => roles.includes(role));

        return user && user.role && hasRole();
    }

}
