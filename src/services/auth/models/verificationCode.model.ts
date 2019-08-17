import * as mongoose from 'mongoose';
export const PhoneVerificationModelName = 'Auth_PhoneVerification';
export const PhoneVerificationSchema = new mongoose.Schema({
    code: String,
    phone: String,
    expires: Date,
}, {
        timestamps: true,
    });

export interface PhoneVerification extends mongoose.Document {
    readonly code: string;
    readonly phone: string;
    readonly expires: Date;
}
