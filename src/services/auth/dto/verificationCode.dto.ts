import { CodeType } from '../helpers/phoneAuth.helper';

export class VerificationCodeOutout {
    codeLength: number;
    expires: Date;
    codeType: CodeType;
}
