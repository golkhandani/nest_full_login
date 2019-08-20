import { ValidationArguments, Validate, Length, IsAlpha, NotEquals, IsNotEmpty, IsDefined, IsEmail, IsPhoneNumber, ValidateIf, ValidationError } from 'class-validator';
import { UserAlreadyExist } from '../validators/userAlreadyExists';
import { HttpException, HttpStatus } from '@nestjs/common';

export class CreateByUsername {
    @IsAlpha()
    @NotEquals('test')
    @Validate(UserAlreadyExist, {
        message: 'user exists',
    })
    @IsDefined()
    readonly username: string;

    @IsNotEmpty()
    @Length(10, 20, {
        message: (args: ValidationArguments) => {
            if (args.value) {
                if (args.value.length === 1) {
                    return 'too short password';
                } else {
                    return `must be more than ${args.constraints[0]} char`;
                }
            }

        },
    })
    @IsDefined()
    public password: string;
    @ValidateIf((o, value) => {
        if ((o as CreateByUsername).password === value) {
            return true;
        } else {
            throw new HttpException('passwords dont match', HttpStatus.BAD_REQUEST);
        }
    })
    readonly reEnteredPassword: string;
}

// tslint:disable-next-line: max-classes-per-file
export class CreateByEmail {
    @IsEmail()
    @NotEquals('test')
    @Validate(UserAlreadyExist, {
        message: 'user exists',
    })
    @IsDefined()
    readonly email: string;

    @IsNotEmpty()
    @Length(10, 20, {
        message: (args: ValidationArguments) => {
            if (args.value) {
                if (args.value.length === 1) {
                    return 'too short password';
                } else {
                    return `must be more than ${args.constraints[0]} char`;
                }
            }

        },
    })
    @IsDefined()
    readonly password: string;
}

// tslint:disable-next-line: max-classes-per-file
export class CreateByPhoneNumber {
    @IsPhoneNumber('IR')
    @NotEquals('test')
    @Validate(UserAlreadyExist, {
        message: 'user exists',
    })
    @IsDefined()
    readonly phone: string;
}
// tslint:disable-next-line: max-classes-per-file
export class CreateByPhoneCode {
    @IsPhoneNumber('IR')
    @NotEquals('test')
    @Validate(UserAlreadyExist, {
        message: 'user exists',
    })
    @IsDefined()
    readonly phone: string;

    @IsNotEmpty()
    @IsDefined()
    readonly code: string;
}
