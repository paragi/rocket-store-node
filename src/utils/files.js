/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz) 
files.js (c) 2023 
Created:  2023-10-27 03:18:06 
Desc: file tools
Docs: documentation
*/

/**
 *
 * @param {*} file
 */
export const fileLock = async (file) => {
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
};
