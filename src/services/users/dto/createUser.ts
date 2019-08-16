import { ValidationArguments, Validate, Length, IsAlpha, NotEquals, IsNotEmpty, IsDefined, IsEmail } from 'class-validator';
import { UserAlreadyExist } from '../validators/userAlreadyExists';

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
    readonly password: string;
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
