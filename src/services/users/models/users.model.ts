import * as mongoose from 'mongoose';

export const UserModelName = 'User';

export enum UserRole {
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

    /** Profile */
    name: String,
    picture: String,

    /** Access */
    role: String,
}, {
        timestamps: true,
    });

export interface User extends mongoose.Document {

    readonly username: string;
    readonly password: string;

    readonly google: string;

    readonly email: string;
    readonly email_verified: boolean;

    readonly name: string;
    readonly picture: string;

    readonly role: UserRole;
}
