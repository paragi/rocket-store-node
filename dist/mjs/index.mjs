/*
Author: Simon Riget
Contributor: <Anton Sychev> (anton at sychev dot xyz)
index.mjs (c) 2017 - 2023
Created:  2023-10-26 02:43:48
Desc: Rocket Store - A very simple and yet powerful file storage.
License:
    * MIT: (c) Paragi 2017, Simon Riget.
Terminology:
  Rocketstore was made to replace a more complex database, in a setting that didn't quite need that level of functionality.
  Rocketstore is intended to store and retrieve records/documents, organized in collections, using a key.

  to translate between rocketstore sql and file system terms:
  +------------------+---------------+------------------------+
  | storage area     |  database     |  data directory root   |
  +------------------+---------------+------------------------+
  | collection       |  table        |  directory             |
  +------------------+---------------+------------------------+
  | key              |  key          |  file name             |
  +------------------+---------------+------------------------+
  | record           |  row          |  file                  |
  +------------------+---------------+------------------------+
*/
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import globToRegExp from "glob-to-regexp";
import { fileNameWash, identifierNameTest, identifierNameSimplyTest } from "./utils/filesValidators.mjs";
import { fileLock, fileUnlock } from "./utils/files.mjs";
//TODO: max items per folder, split into subfolders
import { _ORDER, _ORDER_DESC, _ORDERBY_TIME, _LOCK, _DELETE, _KEYS, _COUNT, _ADD_AUTO_INC, _ADD_GUID, _FORMAT_JSON, _FORMAT_NATIVE, _FORMAT_XML, _FORMAT_PHP, _FILECHECK_DEFAULT, _FILECHECK_LOW, } from "./constants.mjs";
const Rocketstore = async (set_option) => {
    if (typeof set_option !== "undefined")
        await Rocketstore.options(set_option);
    return Rocketstore;
};
// Declare default constant for export
Rocketstore._ORDER = _ORDER;
Rocketstore._ORDER_DESC = _ORDER_DESC;
Rocketstore._ORDERBY_TIME = _ORDERBY_TIME;
Rocketstore._LOCK = _LOCK;
Rocketstore._DELETE = _DELETE;
Rocketstore._KEYS = _KEYS;
Rocketstore._COUNT = _COUNT;
Rocketstore._ADD_AUTO_INC = _ADD_AUTO_INC;
Rocketstore._ADD_GUID = _ADD_GUID;
Rocketstore._FORMAT_JSON = _FORMAT_JSON;
Rocketstore._FORMAT_NATIVE = _FORMAT_NATIVE;
Rocketstore._FORMAT_XML = _FORMAT_XML;
Rocketstore._FORMAT_PHP = _FORMAT_PHP;
Rocketstore._FILECHECK_DEFAULT = _FILECHECK_DEFAULT;
Rocketstore._FILECHECK_LOW = _FILECHECK_LOW;
Rocketstore.data_storage_area = path.normalize(os.tmpdir() + "/rsdb");
// Cashing object. (Might become very large)
Rocketstore.keyCache = {};
// Set default options
Rocketstore.data_format = _FORMAT_JSON;
Rocketstore.lock_retry_interval = 13; // ms
Rocketstore.lock_files = true;
Rocketstore.check_files = _FILECHECK_DEFAULT;
/**
 * Set options
 * @param {Object} options
 */
Rocketstore.options = async (options = {}) => {
    if (!Object.keys(options).length)
        return;
    // Format
    if (typeof options.data_format !== "undefined")
        if (typeof options.data_format === "number") {
            if (options.data_format & (_FORMAT_JSON | _FORMAT_XML | _FORMAT_NATIVE))
                Rocketstore.data_format = options.data_format;
        }
        else
            throw new Error(`Unknown data format: '${options.data_format}'`);
    // Set native data format
    if (options.data_format || Rocketstore.data_format === _FORMAT_NATIVE)
        Rocketstore.data_format = _FORMAT_JSON;
    // Data storage area
    if (typeof options.data_storage_area === "string" || typeof options.data_storage_area === "number") {
        Rocketstore.data_storage_area = path.resolve(options.data_storage_area);
        try {
            const status = fs.lstatSync(Rocketstore.data_storage_area, {
                mode: 0o775,
                throwIfNoEntry: false,
            });
            if (!status)
                fs.mkdirSync(Rocketstore.data_storage_area, { recursive: true, mode: 0o775 });
        }
        catch (err) {
            throw new Error(`Unable to create data storage directory '${Rocketstore.data_storage_area}': `, err);
        }
    }
    else if (typeof options.data_storage_area !== "undefined")
        throw new Error(`Data storage area must be a directory path`);
    // lock timing
    if (typeof options.lock_retry_interval === "number")
        Rocketstore.lock_retry_interval = options.lock_retry_interval;
    // lock files
    if (typeof options.lock_files === "boolean")
        Rocketstore.lock_files = options.lock_files;
    // filecheck
    if (typeof options.check_files === "boolean")
        Rocketstore.check_files = options.check_files;
};
/**
 *   Post a data record (Insert or overwrite)
 *   If keyCache exists for the given collection, entries are added.
 * @param {string} collection
 * @param {string} key
 * @param {*} record input data
 * @param {*} flags
 * @returns {Object} {key: string, count: number}
 */
Rocketstore.post = async (collection, key, record, flags) => {
    collection = "" + (collection || "");
    if (collection.length < 1)
        throw new Error("No valid collection name given");
    if (Rocketstore.check_files === _FILECHECK_DEFAULT)
        if (!identifierNameTest(collection))
            throw new Error("Collection name contains illegal characters (For a javascript identifier)");
    if (Rocketstore.check_files === _FILECHECK_LOW)
        if (!identifierNameSimplyTest(collection))
            throw new Error("Collection name contains illegal characters (For a javascript identifier)");
    // Remove wildwards (unix only)
    key = typeof key === "number" || key ? fileNameWash("" + key).replace(/[\*\?]/g, "") : "";
    if (typeof flags !== "number")
        flags = 0;
    // Insert a sequence
    if (key.length < 1 || flags & _ADD_AUTO_INC) {
        const _sequence = await Rocketstore.sequence(collection);
        key = key.length > 0 ? `${_sequence}-${key}` : `${_sequence}`;
    }
    // Insert a Globally Unique IDentifier
    if (flags & _ADD_GUID) {
        const uid = new Date().getTime().toString(16) + Math.random().toString(16).substring(2) + "0".repeat(16);
        const guid = `${uid.slice(0, 8)}-${uid.slice(8, 12)}-4000-8${uid.slice(12, 15)}-${uid.slice(15)}`;
        key = key.length > 0 ? `${guid}-${key}` : `${guid}`;
    }
    // Write to file
    let dirToWrite = path.join(Rocketstore.data_storage_area, path.sep, collection);
    let fileName = path.join(dirToWrite, path.sep, key);
    if (Rocketstore.data_format & _FORMAT_JSON) {
        if (!fs.existsSync(fileName))
            fs.mkdirSync(dirToWrite, { recursive: true, mode: 0o777 });
        const data = new Uint8Array(Buffer.from(JSON.stringify(record)));
        await fs.promises.writeFile(fileName, data).catch((err) => {
            throw err;
        });
    }
    else
        throw new Error("Sorry, that data format is not supported");
    // Store key in cash
    if (Array.isArray(Rocketstore.keyCache[collection]) && Rocketstore.keyCache[collection].indexOf(key) < 0)
        Rocketstore.keyCache[collection][Rocketstore.keyCache[collection].length] = key;
    return { key: key, count: 1 };
};
/**
 * Get one or more records or list all collections (or delete it)

Generate a list:
    get collection key => list of one key
    get collection key wildcard => read to cash, filter to list
    get collections => no collection + key wildcard => read (no cashing), filter to list.

Cashing:
Whenever readdir is called, keys are stores in keyCache, pr. collection.
The keyCache is maintained whenever a record is deleted or added.
One exception are searches in the root (list of collections etc.), which must be read each time.

NB: Files may have been removed manually and should be removed from the cache
* @param {string} collection
* @param {string} key
* @param {*} flags
* @param {*} min_time
* @param {*} max_time
* @returns
*/
Rocketstore.get = async (collection, key, flags, min_time, max_time) => {
    let keys = [];
    let unCache = [];
    let record = [];
    let promises = [];
    let count = 0;
    // Check collection name
    collection = "" + (collection || "");
    let checkName = Rocketstore.check_files === _FILECHECK_DEFAULT
        ? identifierNameTest(collection)
        : identifierNameSimplyTest(collection);
    if (collection.length > 0 && !checkName)
        throw new Error("Collection name contains illegal characters (For a javascript identifier)");
    // Check key validity
    key = fileNameWash("" + (key || "")).replace(/[*]{2,}/g, "*", true); // remove globstars **
    // Prepare search
    let scanDir = path.normalize(path.join(Rocketstore.data_storage_area, path.sep, collection ? collection + path.sep : ""));
    let wildcard = key.indexOf("*") > -1 || key.indexOf("?") > -1 || !key.length;
    if (wildcard && !(flags & _DELETE && !key)) {
        let list = [];
        // Read directory into cache
        if (!collection || !Array.isArray(Rocketstore.keyCache[collection])) {
            try {
                list = await fs.promises.readdir(scanDir);
                // Update cache
                if (collection && list.length) {
                    Rocketstore.keyCache[collection] = list;
                }
            }
            catch (err) {
                if (err.code !== "ENOENT") {
                    throw err;
                }
            }
        }
        if (collection && Array.isArray(Rocketstore.keyCache[collection])) {
            list = Rocketstore.keyCache[collection];
        }
        // Wildcard search
        if (key && key != "*") {
            let regex = globToRegExp(key); // ? are not dealt with. replace \? => ?
            regex = new RegExp(String(regex).slice(1, -1).replace(/\\\?/g, ".?"));
            let haystack = collection ? Rocketstore.keyCache[collection] : list;
            for (let i in haystack)
                if (regex.test(haystack[i]))
                    keys[keys.length] = haystack[i]; // 10 x faster than push
        }
        else {
            keys = list;
        }
        // Order by key value
        if (flags & (_ORDER | _ORDER_DESC) && keys && keys.length > 1 && !(flags & (_DELETE | (flags & _COUNT)))) {
            keys.sort();
            if (flags & _ORDER_DESC)
                keys.reverse();
        }
        // Order and limit by time
        // Exact key
    }
    else {
        if (collection &&
            Array.isArray(Rocketstore.keyCache[collection]) &&
            Rocketstore.keyCache[collection].indexOf(key) < 0)
            keys = [];
        else if (key)
            keys = [key];
    }
    count = keys.length;
    // Read specific records
    if (keys.length && collection && !(flags & (_KEYS | _COUNT | _DELETE))) {
        for (let i in keys) {
            let fileName = scanDir + keys[i];
            // Read JSON record file
            if (Rocketstore.data_format & _FORMAT_JSON) {
                promises[promises.length] = new Promise((resolve, reject) => {
                    fs.readFile(fileName, "utf8", ((i) => {
                        return (err, data) => {
                            if (err) {
                                if (err.code != "ENOENT")
                                    reject(err);
                                else {
                                    unCache[unCache.length] = keys[i];
                                    record[i] = "*deleted*";
                                    count--;
                                    resolve();
                                }
                            }
                            else {
                                try {
                                    record[i] = JSON.parse(data);
                                }
                                catch (err) {
                                    record[i] = "";
                                }
                                resolve();
                            }
                        };
                    })(i));
                });
            }
            else
                throw new Error("Sorry, that data format is not supported");
        }
        // Delete
    }
    else if (flags & _DELETE) {
        // Delete database
        if (!collection && !key) {
            if (fs.existsSync(Rocketstore.data_storage_area)) {
                promises[promises.length] = fs.rm(Rocketstore.data_storage_area, { force: true, recursive: true }, () => { });
                Rocketstore.keyCache = {};
                count = 1;
            }
            // Delete collection and sequences
        }
        else if (collection && !key) {
            let fileName = path.join(Rocketstore.data_storage_area + path.sep + collection);
            count = 0;
            if (fs.existsSync(fileName)) {
                const statCheck = fs.statSync(fileName);
                if (statCheck.isDirectory()) {
                    // Delete collection folder
                    promises[promises.length] = fs.promises.rm(fileName, { recursive: true, force: true }, () => { });
                    count++;
                }
                // Delete single file
                const fileNameSeq = `${fileName}_seq`;
                if (fs.existsSync(fileNameSeq)) {
                    promises[promises.length] = fs.unlink(fileNameSeq, () => { });
                    count++;
                }
            }
            delete Rocketstore.keyCache[collection];
            // Delete records and  ( collection and sequences found with wildcards )
        }
        else if (keys.length) {
            for (let i in keys) {
                promises[promises.length] = fs.promises.rm(path.join(scanDir + keys[i]), { force: true, recursive: true }, () => { });
                if (collection)
                    unCache = keys[i];
                else
                    unCache = [...unCache, ...[keys[i]]];
            }
        }
    }
    if (promises.length > 0)
        await Promise.all(promises);
    // Clean up cache and keys
    if (unCache.length) {
        if (Array.isArray(Rocketstore.keyCache[collection]))
            Rocketstore.keyCache[collection] = Rocketstore.keyCache[collection].filter((e) => unCache.indexOf(e) < 0);
        if (keys != Rocketstore.keyCache[collection])
            keys = keys.filter((e) => unCache.indexOf(e) < 0);
        if (record.length)
            record = record.filter((e) => e != "*deleted*");
    }
    let result = { count: count };
    if (result.count && keys.length && !(flags & (_COUNT | _DELETE)))
        result.key = keys;
    if (record.length > 0)
        result.result = record;
    return result;
};
/**
 * Delete one or more records or collections
 * @param {string} collection
 * @param {string} key
 */
Rocketstore.delete = async (collection, key) => {
    return Rocketstore.get(collection, key, _DELETE, null, null);
};
/**
 *  Get and auto incremented sequence or create it
 * @param {string} seq_name
 * @returns {Promise<number>} The next sequence value
 */
Rocketstore.sequence = async (seq_name) => {
    if (!seq_name)
        throw new Error("Sequence name is invalid");
    let sequence = -1;
    // Assert name
    let name = fileNameWash(seq_name);
    if (typeof name !== "string" || name.length < 1)
        throw new Error("Sequence name is invalid");
    name += "_seq";
    const fileName = path.join(Rocketstore.data_storage_area, path.sep, name);
    //lock file
    if (Rocketstore.lock_files)
        await fileLock(Rocketstore.data_storage_area, name, Rocketstore.lock_retry_interval);
    try {
        const data = await fs.promises.readFile(fileName, "utf8");
        sequence = parseInt(data) + 1 || 1;
        await fs.promises.writeFile(fileName, sequence.toString());
    }
    catch (err) {
        if (err.code === "ENOENT") {
            try {
                await fs.promises.mkdir(path.dirname(fileName), { recursive: true });
                await fs.promises.writeFile(fileName, "1");
                sequence = 1;
            }
            catch (createErr) {
                console.error("[154] Error creating file:", createErr);
                //throw new Error("Error creating file");
                throw createErr;
            }
        }
        else {
            console.error("[158] Error reading/writing file:", err);
            //throw new Error("Error reading/writing file");
            throw err;
        }
    }
    //unlock file
    if (Rocketstore.lock_files)
        await fileUnlock(Rocketstore.data_storage_area, name);
    return sequence;
};
export * from "./constants.mjs";
export { Rocketstore };
export default Rocketstore;
