import * as mongoose from 'mongoose';
import { UserRole } from '../../users/models/users.model';

export const UserBridgeModelName = 'User';
export const UserBridgeSchema = new mongoose.Schema({

    username: String, /** Login 1 => username password */ /** Login 2 => google */
    password: String, /** Login 1 => username password */
    google: String, /** Login 2 => google */

    /** Login 3 => email password */
    email: String,
    email_verified: Boolean,
    /** Profile */
    name: String, /** Login 2 => google */
    picture: String, /** Login 2 => google */

    /** Access */
    role: { type: String, default: UserRole.USER },
});

export interface UserBridge extends mongoose.Document {
    readonly username: string;
    readonly password: string;

    readonly google: string;

    readonly email: string;
    readonly email_verified: boolean;

    readonly name: string;
    readonly picture: string;

    readonly role: UserRole;
}
