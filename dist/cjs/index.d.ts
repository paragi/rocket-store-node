export * from "./constants.js";
export default Rocketstore;
export function Rocketstore(set_option: any): Promise<{
    (set_option: any): Promise<any>;
    _ORDER: number;
    _ORDER_DESC: number;
    _ORDERBY_TIME: number;
    _LOCK: number;
    _DELETE: number;
    _KEYS: number;
    _COUNT: number;
    _ADD_AUTO_INC: number;
    _ADD_GUID: number;
    _FORMAT_JSON: number;
    _FORMAT_NATIVE: number;
    _FORMAT_XML: number;
    _FORMAT_PHP: number;
    data_storage_area: string;
    keyCache: {};
    data_format: number;
    lock_retry_interval: number;
    lock_files: boolean;
    /**
     * Set options
     * @param {Object} options
     */
    options(options?: Object): Promise<void>;
    /**
     *   Post a data record (Insert or overwrite)
     *   If keyCache exists for the given collection, entries are added.
     * @param {string} collection
     * @param {string} key
     * @param {*} record input data
     * @param {*} flags
     * @returns {Object} {key: string, count: number}
     */
    post(collection: string, key: string, record: any, flags: any): Object;
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
    get(collection: string, key: string, flags: any, min_time: any, max_time: any): Promise<{
        count: number;
    }>;
    /**
     * Delete one or more records or collections
     * @param {string} collection
     * @param {string} key
     */
    delete(collection: string, key: string): Promise<{
        count: number;
    }>;
    /**
     *  Get and auto incremented sequence or create it
     * @param {string} seq_name
     * @returns {Promise<number>} The next sequence value
     */
    sequence(seq_name: string): Promise<number>;
}>;
export namespace Rocketstore {
    export { _ORDER };
    export { _ORDER_DESC };
    export { _ORDERBY_TIME };
    export { _LOCK };
    export { _DELETE };
    export { _KEYS };
    export { _COUNT };
    export { _ADD_AUTO_INC };
    export { _ADD_GUID };
    export { _FORMAT_JSON };
    export { _FORMAT_NATIVE };
    export { _FORMAT_XML };
    export { _FORMAT_PHP };
    export let data_storage_area: string;
    export let keyCache: {};
    export { _FORMAT_JSON as data_format };
    export let lock_retry_interval: number;
    export let lock_files: boolean;
    /**
     * Set options
     * @param {Object} options
     */
    export function options(options?: Object): Promise<void>;
    /**
     *   Post a data record (Insert or overwrite)
     *   If keyCache exists for the given collection, entries are added.
     * @param {string} collection
     * @param {string} key
     * @param {*} record input data
     * @param {*} flags
     * @returns {Object} {key: string, count: number}
     */
    export function post(collection: string, key: string, record: any, flags: any): Object;
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
    export function get(collection: string, key: string, flags: any, min_time: any, max_time: any): Promise<{
        count: number;
    }>;
    /**
     * Delete one or more records or collections
     * @param {string} collection
     * @param {string} key
     */
    function _delete(collection: string, key: string): Promise<{
        count: number;
    }>;
    export { _delete as delete };
    /**
     *  Get and auto incremented sequence or create it
     * @param {string} seq_name
     * @returns {Promise<number>} The next sequence value
     */
    export function sequence(seq_name: string): Promise<number>;
}
import { _ORDER } from "./constants.js";
import { _ORDER_DESC } from "./constants.js";
import { _ORDERBY_TIME } from "./constants.js";
import { _LOCK } from "./constants.js";
import { _DELETE } from "./constants.js";
import { _KEYS } from "./constants.js";
import { _COUNT } from "./constants.js";
import { _ADD_AUTO_INC } from "./constants.js";
import { _ADD_GUID } from "./constants.js";
import { _FORMAT_JSON } from "./constants.js";
import { _FORMAT_NATIVE } from "./constants.js";
import { _FORMAT_XML } from "./constants.js";
import { _FORMAT_PHP } from "./constants.js";
