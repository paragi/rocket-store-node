/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz) 
files.js (c) 2023 
Created:  2023-10-27 03:18:06 
Desc: file tools lock and unlock
*/

import fs from "node:fs";
import path from "node:path";

/**
 *  lock file for writing
 * @param {string} file
 */
export const fileLock = async (file) => {
	console.log("fileLock", file);

	/*
    return new Promise((resolve, reject) => {
		try {
			const lockPath = path.join(rocketstore.data_storage_area, path.sep, "lockfile");
			const status = fs.lstatSync(lockPath, { throwIfNoEntry: false });
			if (!status) fs.mkdirSync(lockPath);

			const f = fs.symlinkSync(
				path.join(rocketstore.data_storage_area, name),
				path.join(rocketstore.data_storage_area, path.sep, "lockfile", name),
			);
			if (!f) reject();
			return resolve();
		} catch (err) {
			if (err.code === "EEXIST") {
				setTimeout(() => {
					do_lock(name);
				}, rocketstore.lock_retry_interval);
			} else {
				console.log("390", err);
				return reject(err);
			}
		}
	});
    */

	/*
const do_lock = (name, resolve, reject) => {
  fs.symlink(
    rocketstore.data_storage_area + path.sep + name,
    rocketstore.data_storage_area + path.sep + 'lockfile' + path.sep + name,
    (err) => {
      if(err)
        if(err.code == 'EEXIST')
          setTimeout(() => {
            do_lock(name, resolve, reject)
          }, rocketstore.lock_retry_interval);
        else
          reject(err);
      else
        resolve();
    });
}
    */
};

/**
 *  unlock file after writing
 * @param {string} file
 */
export const fileUnlock = async (file) => {
	console.log("fileUnlock", file);
	/*
    return new Promise((resolve, reject) => {
		const fileLockName = path.join(rocketstore.data_storage_area, path.sep, "lockfile", name);

		if (!fs.existsSync(fileLockName)) return resolve();

		try {
			fs.promises.unlink(fileLockName);
			return resolve();
		} catch (err) {
			console.log("410", err);
			return reject(err);
		}
	});
    */

	/*
    fs.unlink(rocketstore.data_storage_area + path.sep + 'lockfile' + path.sep + name, (err) => {
    if (err) console.error(err);
  });
    */
};
