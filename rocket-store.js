/*============================================================================*\
    Rocket Store (Rocket store)

    A very simple and yes powerfull file storage.

    (c) Paragi 2017, Simon Riget.

    License MIT

    Usages:

    const rs = require('rocket-store');

    result = await rs.post( collection, key, record [, options])
    result = await rs.get( collection, key [, options])
    result = await rs.delete( collection, key)

    To chamge default options, call rs with an options object.
    Example:
        await rs( {data_format:rs._FORMAT_NATIVE, data_storage_area:  "./data"} );
    or
        await rs.set_options({data_format:rs._FORMAT_NATIVE, data_storage_area:  "./data"});



\*============================================================================*/
const fs = require('fs-extra')
const sanitize = require("sanitize-filename");
const lockfile = require('proper-lockfile');
const path = require('path');
const os = require('os');
//const pathExists = require('path-exists');

/*========================================================================*\
  Define module object
\*========================================================================*/
const rocketstore = async (set_option) => {
    if( typeof(set_option) !== "undefined")
        await rocketstore.setOptions(set_option);
    return rocketstore;
};

module.exports = exports = rocketstore;
/*========================================================================*\
  Define constants used in options
\*========================================================================*/

// Get options
rocketstore._ORDER        = 0x01;
rocketstore._ORDER_DESC   = 0x02;
rocketstore._ORDERBY_TIME = 0x04;
rocketstore._LOCK         = 0x08;
rocketstore._DELETE       = 0x10;

// Post options
rocketstore._ADD_AUTO_INC = 0x40;

// Data storage format options
rocketstore._FORMAT_JSON  = 0x01;
rocketstore._FORMAT_NATIVE= 0x02;
rocketstore._FORMAT_XML   = 0x04; // Not implemened
rocketstore._FORMAT_PHP   = 0x08;

// Set default options

// ! brug fs.mkdtemp
rocketstore.data_format         = rocketstore._FORMAT_NATIVE;
rocketstore.data_storage_area   = path.normalize(os.tmpdir() + "/rsdb");

/*========================================================================*\
  Post a data record (Insert or overwrite)
\*========================================================================*/
rocketstore.post = async (collection, key_request, record ,flags) => {
    let new_key = "";
    let key = "";
    let sequence = 0;

    if(typeof collection !== "number" &&
        (typeof collection !== "string" || collection.length < 1) )
            throw new Error('No valid collection name given');

    if(typeof(flags) !=="number")
        flags = 0;

    key = sanitize("" + key_request);

    // Insert a sequence
    if(key.length < 1 || (flags & rocketstore._ADD_AUTO_INC)) {
        let sequence = await rocketstore.sequence(collection);
        key = `${sequence}-${key}`;
    }
console.log("Post:",collection, key, record ,flags);
    // Write to file
    if(rocketstore.data_format & rocketstore._FORMAT_JSON)
        await fs.outputJson(
            rocketstore.data_storage_area
            + path.sep
            + collection
            + path.sep
            + key
            , record
        );

    else
        throw new Error('Sorry, dataformat not supported');

    return {key: key, count: 1};
}

/*========================================================================*\
  Get one or more records or list all collections (or delete it)
\*========================================================================
const rocketstore.get = async (collection = '', key = '', min_time = null , max_time = null, flags = 0){

}
/*========================================================================*\
  Delete one or more records or collections
\*========================================================================
const rocketstore.delete = async ($collection = null, $key = null){
    return this->get(collection,key,null,null,_DELETE);
}
*/

/*========================================================================*\
  Get and auto incremented sequence or create it
  Return count
\*========================================================================*/
rocketstore.sequence = async (seq_name) => {
    let sequence = 0;
    let name = sanitize(seq_name);

    if(typeof(name) !=="string" || name.length < 1)
        throw new Error('Sequence name i messed up');

    let file_name = rocketstore.data_storage_area + path.sep + name + '_seq';
    try{
        const release = await lockfile.lock(file_name);
        sequence = parseInt(await fs.readFile(file_name,'utf8'));
    }catch(err){
        console.log(err);
        sequence = 0;
    }

    await fs.outputFile(file_name,++sequence);
console.log(`Sqeuence ${file_name} = ${sequence}`);
    release();

    return sequence;
}


/*========================================================================*\
  Set options
\*========================================================================*/
rocketstore.setOptions = async (set_option) => {
    // Format
    if( typeof(set_option.data_format) !== "undefined" )
        if( typeof(set_option.data_format) === "number" ){
            if( set_option.data_format & (
                  rocketstore._FORMAT_JSON
                | rocketstore._FORMAT_XML
                | rocketstore._FORMAT_NATIVE)
            )
                rocketstore.data_format = set_option.data_format;

        }else
            throw new Error (`Unknown data format: '${set_option.data_format}'`);

    // Set native data format
    if( rocketstore.data_format == rocketstore._FORMAT_NATIVE )
        rocketstore.data_format = rocketstore._FORMAT_JSON;

    // Data storage area
    if(    typeof(set_option.data_storage_area) === "string"
        || typeof(set_option.data_storage_area) === "number"
        ){
            let dir = path.resolve(set_option.data_storage_area);
            await fs.ensureDir(dir, {mode: 02775});
            rocketstore.data_storage_area = dir;

    }else if ( typeof(set_option.data_storage_area) !== "undefined" )
        throw new Error (`Data storage area must be a directory path`);
}



/*========================================================================*\
                            Internal functions
\*========================================================================*/
