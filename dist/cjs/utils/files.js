"use strict";
/*
Author: Simon Riget
Contributor: <Anton Sychev> (anton at sychev dot xyz)
index.js (c) 2017 - 2023
Created:  2023-10-28 02:12:56
Desc: File tools lock and unlock
License:
    * MIT: (c) Paragi 2017, Simon Riget.
*/
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
exports.fileUnlock = exports.fileLock = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
/**
 *  lock file for writing
 * @param {string} pathFolder
 * @param {string} file
 * @param {int} lock_retry_interval
 */
const fileLock = (pathFolder, file, lock_retry_interval = 13) => __awaiter(void 0, void 0, void 0, function* () {
    //console.log("fileLock", pathFolder, file);
    return new Promise((resolve, reject) => {
        try {
            const sourcePath = node_path_1.default.join(pathFolder, node_path_1.default.sep, file);
            const targetPath = node_path_1.default.join(pathFolder, node_path_1.default.sep, "lockfile", node_path_1.default.sep, file);
            const status = node_fs_1.default.lstatSync(node_path_1.default.join(pathFolder, node_path_1.default.sep, "lockfile"), { throwIfNoEntry: false });
            if (!status)
                node_fs_1.default.mkdirSync(node_path_1.default.join(pathFolder, node_path_1.default.sep, "lockfile"), { recursive: true });
            return node_fs_1.default.promises
                .symlink(sourcePath, targetPath)
                .then(() => resolve())
                .catch((err) => {
                if (err.code === "EEXIST")
                    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                        yield (0, exports.fileLock)(pathFolder, file, lock_retry_interval);
                    }), lock_retry_interval);
            });
        }
        catch (err) {
            //console.error("[390] -> filelock -> ", err);
            return reject();
        }
    });
});
exports.fileLock = fileLock;
/**
 *  unlock file after writing
 * @param {string} pathFolder
 * @param {string} file
 */
const fileUnlock = (pathFolder, file) => __awaiter(void 0, void 0, void 0, function* () {
    //console.log("fileUnlock", pathFolder, file);
    return new Promise((resolve, reject) => {
        const fileLockName = node_path_1.default.join(pathFolder, node_path_1.default.sep, "lockfile", node_path_1.default.sep, file);
        if (!node_fs_1.default.existsSync(fileLockName))
            return resolve();
        try {
            node_fs_1.default.promises.unlink(fileLockName, { recursive: true });
            return resolve();
        }
        catch (err) {
            //console.log("[410] file unlock ->", err);
            return reject();
        }
    });
});
exports.fileUnlock = fileUnlock;
