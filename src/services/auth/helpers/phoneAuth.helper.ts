import { KavenegarSMS, KavenegarSmsType } from './kavenegarSms.helper';

export class PhoneVerfication {
    public static get randomCode() {
        const high = 9999;
        const low = 1000;
        let code = '1111';
        code = (Math.floor(Math.random() * (high - low) + low)).toString();
        return {
            codeLength: code.toString().length,
            code,
        };
    }

    public static async sendSmsByKavenegar(phone, message) {
        const kavenegar = new KavenegarSMS(phone, message);
        const knr = await kavenegar.send(KavenegarSmsType.TEMPLATE);
        return knr;
    }
}
