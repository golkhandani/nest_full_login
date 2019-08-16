import * as mongoose from 'mongoose';
export const RefreshTokenModelName = 'Auth_RefreshToken';
export const RefreshTokenSchema = new mongoose.Schema({
    token: String,
    user: mongoose.Schema.Types.ObjectId,
    expires: Date,
}, {
        timestamps: true,
    });

export interface RefreshToken extends mongoose.Document {
    readonly token: string;
    readonly user: string;
    readonly expires: Date;
}
