"use strict";
/*
Author: Simon Riget
Contributor: <Anton Sychev> (anton at sychev dot xyz)
index.js (c) 2017 - 2023
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rocketstore = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_buffer_1 = require("node:buffer");
const glob_to_regexp_1 = __importDefault(require("glob-to-regexp"));
const filesValidators_1 = require("./utils/filesValidators");
const files_1 = require("./utils/files");
//TODO: max items per folder, split into subfolders
const constants_js_1 = require("./constants.js");
const Rocketstore = (set_option) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof set_option !== "undefined")
        yield Rocketstore.options(set_option);
    return Rocketstore;
});
exports.Rocketstore = Rocketstore;
// Declare default constant for export
Rocketstore._ORDER = constants_js_1._ORDER;
Rocketstore._ORDER_DESC = constants_js_1._ORDER_DESC;
Rocketstore._ORDERBY_TIME = constants_js_1._ORDERBY_TIME;
Rocketstore._LOCK = constants_js_1._LOCK;
Rocketstore._DELETE = constants_js_1._DELETE;
Rocketstore._KEYS = constants_js_1._KEYS;
Rocketstore._COUNT = constants_js_1._COUNT;
Rocketstore._ADD_AUTO_INC = constants_js_1._ADD_AUTO_INC;
Rocketstore._ADD_GUID = constants_js_1._ADD_GUID;
Rocketstore._FORMAT_JSON = constants_js_1._FORMAT_JSON;
Rocketstore._FORMAT_NATIVE = constants_js_1._FORMAT_NATIVE;
Rocketstore._FORMAT_XML = constants_js_1._FORMAT_XML;
Rocketstore._FORMAT_PHP = constants_js_1._FORMAT_PHP;
Rocketstore.data_storage_area = node_path_1.default.normalize(node_os_1.default.tmpdir() + "/rsdb");
// Cashing object. (Might become very large)
Rocketstore.keyCache = {};
// Set default options
Rocketstore.data_format = constants_js_1._FORMAT_JSON;
Rocketstore.lock_retry_interval = 13; // ms
Rocketstore.lock_files = true;
/**
 * Set options
 * @param {Object} options
 */
Rocketstore.options = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (options = {}) {
    if (!Object.keys(options).length)
        return;
    // Format
    if (typeof options.data_format !== "undefined")
        if (typeof options.data_format === "number") {
            if (options.data_format & (constants_js_1._FORMAT_JSON | constants_js_1._FORMAT_XML | constants_js_1._FORMAT_NATIVE))
                Rocketstore.data_format = options.data_format;
        }
        else
            throw new Error(`Unknown data format: '${options.data_format}'`);
    // Set native data format
    if (options.data_format || Rocketstore.data_format === constants_js_1._FORMAT_NATIVE)
        Rocketstore.data_format = constants_js_1._FORMAT_JSON;
    // Data storage area
    if (typeof options.data_storage_area === "string" || typeof options.data_storage_area === "number") {
        Rocketstore.data_storage_area = node_path_1.default.resolve(options.data_storage_area);
        try {
            const status = node_fs_1.default.lstatSync(Rocketstore.data_storage_area, {
                mode: 0o775,
                throwIfNoEntry: false,
            });
            if (!status)
                node_fs_1.default.mkdirSync(Rocketstore.data_storage_area, { recursive: true, mode: 0o775 });
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
});
/**
 *   Post a data record (Insert or overwrite)
 *   If keyCache exists for the given collection, entries are added.
 * @param {string} collection
 * @param {string} key
 * @param {*} record input data
 * @param {*} flags
 * @returns {Object} {key: string, count: number}
 */
Rocketstore.post = (collection, key, record, flags) => __awaiter(void 0, void 0, void 0, function* () {
    collection = "" + (collection || "");
    if (collection.length < 1)
        throw new Error("No valid collection name given");
    if (!(0, filesValidators_1.identifierNameTest)(collection))
        throw new Error("Collection name contains illegal characters (For a javascript identifier)");
    // Remove wildwards (unix only)
    key = typeof key === "number" || key ? (0, filesValidators_1.fileNameWash)("" + key).replace(/[\*\?]/g, "") : "";
    if (typeof flags !== "number")
        flags = 0;
    // Insert a sequence
    if (key.length < 1 || flags & constants_js_1._ADD_AUTO_INC) {
        const _sequence = yield Rocketstore.sequence(collection);
        key = key.length > 0 ? `${_sequence}-${key}` : `${_sequence}`;
    }
    // Insert a Globally Unique IDentifier
    if (flags & constants_js_1._ADD_GUID) {
        const uid = new Date().getTime().toString(16) + Math.random().toString(16).substring(2) + "0".repeat(16);
        const guid = `${uid.slice(0, 8)}-${uid.slice(8, 12)}-4000-8${uid.slice(12, 15)}-${uid.slice(15)}`;
        key = key.length > 0 ? `${guid}-${key}` : `${guid}`;
    }
    // Write to file
    let dirToWrite = node_path_1.default.join(Rocketstore.data_storage_area, node_path_1.default.sep, collection);
    let fileName = node_path_1.default.join(dirToWrite, node_path_1.default.sep, key);
    if (Rocketstore.data_format & constants_js_1._FORMAT_JSON) {
        if (!node_fs_1.default.existsSync(fileName))
            node_fs_1.default.mkdirSync(dirToWrite, { recursive: true, mode: 0o777 });
        const data = new Uint8Array(node_buffer_1.Buffer.from(JSON.stringify(record)));
        yield node_fs_1.default.promises.writeFile(fileName, data).catch((err) => {
            throw err;
        });
    }
    else
        throw new Error("Sorry, that data format is not supported");
    // Store key in cash
    if (Array.isArray(Rocketstore.keyCache[collection]) && Rocketstore.keyCache[collection].indexOf(key) < 0)
        Rocketstore.keyCache[collection][Rocketstore.keyCache[collection].length] = key;
    return { key: key, count: 1 };
});
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
Rocketstore.get = (collection, key, flags, min_time, max_time) => __awaiter(void 0, void 0, void 0, function* () {
    let keys = [];
    let unCache = [];
    let record = [];
    let promises = [];
    let count = 0;
    // Check collection name
    collection = "" + (collection || "");
    if (collection.length > 0 && !(0, filesValidators_1.identifierNameTest)(collection))
        throw new Error("Collection name contains illegal characters (For a javascript identifier)");
    // Check key validity
    key = (0, filesValidators_1.fileNameWash)("" + (key || "")).replace(/[*]{2,}/g, "*", true); // remove globstars **
    // Prepare search
    let scanDir = node_path_1.default.normalize(node_path_1.default.join(Rocketstore.data_storage_area, node_path_1.default.sep, collection ? collection + node_path_1.default.sep : ""));
    let wildcard = key.indexOf("*") > -1 || key.indexOf("?") > -1 || !key.length;
    if (wildcard && !(flags & constants_js_1._DELETE && !key)) {
        let list = [];
        // Read directory into cache
        if (!collection || !Array.isArray(Rocketstore.keyCache[collection])) {
            try {
                list = yield node_fs_1.default.promises.readdir(scanDir);
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
            let regex = (0, glob_to_regexp_1.default)(key); // ? are not dealt with. replace \? => ?
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
        if (flags & (constants_js_1._ORDER | constants_js_1._ORDER_DESC) && keys && keys.length > 1 && !(flags & (constants_js_1._DELETE | (flags & constants_js_1._COUNT)))) {
            keys.sort();
            if (flags & constants_js_1._ORDER_DESC)
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
    if (keys.length && collection && !(flags & (constants_js_1._KEYS | constants_js_1._COUNT | constants_js_1._DELETE))) {
        for (let i in keys) {
            let fileName = scanDir + keys[i];
            // Read JSON record file
            if (Rocketstore.data_format & constants_js_1._FORMAT_JSON) {
                promises[promises.length] = new Promise((resolve, reject) => {
                    node_fs_1.default.readFile(fileName, "utf8", ((i) => {
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
    else if (flags & constants_js_1._DELETE) {
        // Delete database
        if (!collection && !key) {
            if (node_fs_1.default.existsSync(Rocketstore.data_storage_area)) {
                promises[promises.length] = node_fs_1.default.rm(Rocketstore.data_storage_area, { force: true, recursive: true }, () => { });
                Rocketstore.keyCache = {};
                count = 1;
            }
            // Delete collection and sequences
        }
        else if (collection && !key) {
            let fileName = node_path_1.default.join(Rocketstore.data_storage_area + node_path_1.default.sep + collection);
            count = 0;
            if (node_fs_1.default.existsSync(fileName)) {
                const statCheck = node_fs_1.default.statSync(fileName);
                if (statCheck.isDirectory()) {
                    // Delete collection folder
                    promises[promises.length] = node_fs_1.default.promises.rm(fileName, { recursive: true, force: true }, () => { });
                    count++;
                }
                // Delete single file
                const fileNameSeq = `${fileName}_seq`;
                if (node_fs_1.default.existsSync(fileNameSeq)) {
                    promises[promises.length] = node_fs_1.default.unlink(fileNameSeq, () => { });
                    count++;
                }
            }
            delete Rocketstore.keyCache[collection];
            // Delete records and  ( collection and sequences found with wildcards )
        }
        else if (keys.length) {
            for (let i in keys) {
                promises[promises.length] = node_fs_1.default.promises.rm(node_path_1.default.join(scanDir + keys[i]), { force: true, recursive: true }, () => { });
                if (collection)
                    unCache = keys[i];
                else
                    unCache = [...unCache, ...[keys[i]]];
            }
        }
    }
    if (promises.length > 0)
        yield Promise.all(promises);
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
    if (result.count && keys.length && !(flags & (constants_js_1._COUNT | constants_js_1._DELETE)))
        result.key = keys;
    if (record.length > 0)
        result.result = record;
    return result;
});
/**
 * Delete one or more records or collections
 * @param {string} collection
 * @param {string} key
 */
Rocketstore.delete = (collection, key) => __awaiter(void 0, void 0, void 0, function* () {
    return Rocketstore.get(collection, key, constants_js_1._DELETE, null, null);
});
/**
 *  Get and auto incremented sequence or create it
 * @param {string} seq_name
 * @returns {Promise<number>} The next sequence value
 */
Rocketstore.sequence = (seq_name) => __awaiter(void 0, void 0, void 0, function* () {
    if (!seq_name)
        throw new Error("Sequence name is invalid");
    let sequence = -1;
    // Assert name
    let name = (0, filesValidators_1.fileNameWash)(seq_name);
    if (typeof name !== "string" || name.length < 1)
        throw new Error("Sequence name is invalid");
    name += "_seq";
    const fileName = node_path_1.default.join(Rocketstore.data_storage_area, node_path_1.default.sep, name);
    //lock file
    if (Rocketstore.lock_files)
        yield (0, files_1.fileLock)(Rocketstore.data_storage_area, name, Rocketstore.lock_retry_interval);
    try {
        const data = yield node_fs_1.default.promises.readFile(fileName, "utf8");
        sequence = parseInt(data) + 1 || 1;
        yield node_fs_1.default.promises.writeFile(fileName, sequence.toString());
    }
    catch (err) {
        if (err.code === "ENOENT") {
            try {
                yield node_fs_1.default.promises.mkdir(node_path_1.default.dirname(fileName), { recursive: true });
                yield node_fs_1.default.promises.writeFile(fileName, "1");
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
        yield (0, files_1.fileUnlock)(Rocketstore.data_storage_area, name);
    return sequence;
});
__exportStar(require("./constants.js"), exports);
exports.default = Rocketstore;
