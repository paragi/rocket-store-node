/*
Author: Simon Riget
Contributor: <Anton Sychev> (anton at sychev dot xyz)
index.mjs (c) 2017 - 2024
Created:  2023-10-28 02:12:56
Desc: File tools lock and unlock
License:
    * MIT: (c) Paragi 2017, Simon Riget.
*/
import fs from "node:fs";
import path from "node:path";
/**
 *  lock file for writing
 * @param {string} pathFolder
 * @param {string} file
 * @param {int} lock_retry_interval
 */
export const fileLock = async (pathFolder, file, lock_retry_interval = 13) => {
    //console.log("fileLock", pathFolder, file);
    return new Promise((resolve, reject) => {
        try {
            const sourcePath = path.join(pathFolder, path.sep, file);
            const targetPath = path.join(pathFolder, path.sep, "lockfile", path.sep, file);
            const status = fs.lstatSync(path.join(pathFolder, path.sep, "lockfile"), { throwIfNoEntry: false });
            if (!status)
                fs.mkdirSync(path.join(pathFolder, path.sep, "lockfile"), { recursive: true });
            return fs.promises
                .symlink(sourcePath, targetPath)
                .then(() => resolve())
                .catch((err) => {
                if (err.code === "EEXIST")
                    setTimeout(async () => {
                        await fileLock(pathFolder, file, lock_retry_interval);
                    }, lock_retry_interval);
            });
        }
        catch (err) {
            //console.error("[390] -> filelock -> ", err);
            return reject();
        }
    });
};
/**
 *  unlock file after writing
 * @param {string} pathFolder
 * @param {string} file
 */
export const fileUnlock = async (pathFolder, file) => {
    //console.log("fileUnlock", pathFolder, file);
    return new Promise((resolve, reject) => {
        const fileLockName = path.join(pathFolder, path.sep, "lockfile", path.sep, file);
        if (!fs.existsSync(fileLockName))
            return resolve();
        try {
            fs.promises.unlink(fileLockName, { recursive: true });
            return resolve();
        }
        catch (err) {
            //console.log("[410] file unlock ->", err);
            return reject();
        }
    });
};
