/*============================================================================*\
    Rocket Store

    A very simple and yes powerfull file storage.

    (c) Paragi 2017, Simon Riget.

    License MIT

    Usages:

    const rs = require('rocket-store');

    result = await rs.post( collection, [key], record [, options])
    result = await rs.get( collection, key/search [, options])
    result = await rs.delete( collection, key)

    await rs.set_options({data_format: FORMAT_CONST, data_storage_area: path})
    await rs( {data_format: FORMAT_CONST, data_storage_area: path} )

    number = rs.sequence( name )

\*============================================================================*/
const fs = require('fs-extra')
const sanitize = require("sanitize-filename");
const lockfile = require('proper-lockfile');
const path = require('path');
const os = require('os');
const fg = require('fast-glob');

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
rocketstore._FORMAT_NATIVE= 0x02; // resolves to JSON
rocketstore._FORMAT_XML   = 0x04; // Not implemened
rocketstore._FORMAT_PHP   = 0x08; // Not implemened

// Set default options

// ! brug fs.mkdtemp
rocketstore.data_format         = rocketstore._FORMAT_NATIVE;
rocketstore.data_storage_area   = path.normalize(os.tmpdir() + "/rsdb");

/*========================================================================*\
  Post a data record (Insert or overwrite)
\*========================================================================*/
rocketstore.post = async (collection, key, record ,flags) => {

    collection = fileNameWash( "" + collection );
    if( collection.length < 1 )
        throw new Error('No valid collection name given');

    if(typeof(flags) !=="number")
        flags = 0;

    key = fileNameWash("" + key);

    // Insert a sequence
    if(key.length < 1 || (flags & rocketstore._ADD_AUTO_INC)){
        const sequence = await rocketstore.sequence(collection);
        key = key.length > 0 ? `${sequence}-${key}` : '' + sequence;
    }

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
        throw new Error('Sorry, that data format is not supported');

    return {key: key, count: 1};
}

/*========================================================================*\
  Get one or more records or list all collections (or delete it)
\*========================================================================*/
rocketstore.get = async (collection, key, min_time, max_time, flags) => {
}
/*

public function get($collection = '', $key = '', $min_time = null , $max_time = null, $flags = 0){

    $collection = $this->path_safe($collection);
    $key = $this->path_safe($key,true);

    $path = $this->data_storage_area . $collection . DIRECTORY_SEPARATOR . $key;
    $path .= !($flags & RS_DELETE) && empty($key) ? "*" : "";
    $count = 0;
    $result = [];
    $hit = glob($path, $flags & (RS_ORDER | RS_ORDER_DESC) ? null : GLOB_NOSORT);
    foreach($hit as $full_path){
        // delete
        if($flags & RS_DELETE){
           $count += $this->recursive_file_delete($full_path);

        // Read record
        }else{
            $i = @substr($full_path,strrpos($full_path,DIRECTORY_SEPARATOR) + 1);
            if($flags & RS_LOCK) flock($full_path);
            if($this->data_format & RS_FORMAT_JSON)
                $result[$i] = @json_decode(@file_get_contents($full_path),true);
            else
                $result[$i] = @unserialize(@file_get_contents($full_path));
            $count++;
        }
    }

    return [
         "error" => ""
        ,"result" => $flags & RS_ORDER_DESC ? array_reverse($result) : $result
        ,"count" => $count
    ];
}

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
\*========================================================================*/
rocketstore.sequence = async (seq_name) => {
    let sequence = 0;
    let name = fileNameWash(seq_name);
    let release;

    if(typeof(name) !=="string" || name.length < 1)
        throw new Error('Sequence name i messed up');

    let file_name = rocketstore.data_storage_area + path.sep + name + '_seq';
    try{
        release = await lockfile.lock(file_name);
        sequence = parseInt(await fs.readFile(file_name,'utf8'));
    }catch(err){
        if(err.code != 'ENOENT')
            throw err;
        sequence = 0;
    }

    await fs.outputFile(file_name,++sequence);
    if( typeof release === "function" )
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
function fileNameWash( name ){
    if( os.platform() == 'win32' )
        return sanatize(name);
    else{
        return name.replace(/[\/\x00~]/g, '').replace(/[.]{2,}/g, '');
    }
}
