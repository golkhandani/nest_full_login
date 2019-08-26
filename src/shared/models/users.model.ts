import * as mongoose from 'mongoose';

export const UserModelName = 'User';

export enum UserRole {
    GUEST = 'GUEST',
    USER = 'USER',
    ADMIN = 'ADMIN',
    GOD = 'GOD',
}
export const UserSchema = new mongoose.Schema({

    /** Login 1 => username password */
    username: String,
    password: String,
    /** Login 2 => google */
    google: String,
    /** Login 3 => email password */
    email: String,
    email_verified: Boolean,

    /** Guest login */
    fingerprint: String,
    /** Login 4 => phone */
    phone: String,
    /** Profile */
    name: String,
    picture: String,

    /** Access */
    role: {
        type: String,
        default: UserRole.USER,
    },
}, {
        timestamps: true,
        autoIndex: true,
        id: true,
        _id: true,
        toJSON: {
            transform(v) {
                const obj = v;
                delete obj._doc.password;
                return obj._doc;
            },
        },
    });

export interface User extends mongoose.Document {

    readonly username: string;
    readonly password: string;

    readonly google: string;

    readonly email: string;
    readonly email_verified: boolean;

    readonly fingerprint: string;

    readonly phone: string;

    readonly name: string;
    readonly picture: string;

    readonly role: UserRole;
}
