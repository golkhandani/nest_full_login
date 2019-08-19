import * as multer from 'multer';
import * as  fs from 'fs-extra';

export const tempFolder = `/var/app/temp/users/pictures`;

const storage = multer.diskStorage({
    async destination(req, file, cb) {
        await fsMakeDirIfNotExists(tempFolder);
        cb(null, tempFolder);
    },
    filename(req, file, cb) {
        cb(null, Date.now() + '__' + file.originalname);
    },
});
async function fsMakeDirIfNotExists(path) {
    if (!fs.existsSync(path)) { fs.mkdirpSync(path); }
}
export const multerConstants = {
    multerOptions: {
        storage,
    },
};
