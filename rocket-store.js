/*============================================================================*\
    Rocket Store (Rocket store)

    A very simple and yes powerfull file storage.

    (c) Paragi 2017, Simon Riget.

    License MIT

    Usages:

    const rocketstore = require('rocket-store');

    result = rs.post( collection, key, record [, options])
    result = rs.get( collection, key [, options])
    result = rs.delete( collection, key)

    To chamge default options, call rs with an options object.
    Example:
        rs( {data_format:rs._FORMAT_NATIVE, data_storage_area:  "./data"} );


\*============================================================================*/
const fs = require('fs');
const os = require('os');
const path = require('path');

// Define module object
const rocketstore = function(set_option){
    if( typeof(set_option) !== "undefined")
        rocketstore.setOptions(set_option);
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
rocketstore.data_format         = rocketstore._FORMAT_NATIVE;
rocketstore.data_storage_area   = path.normalize(os.tmpdir() + "/rocket_store");

/*========================================================================*\
  Post a data record (Insert or overwrite)
\*========================================================================*/
rocketstore.post = async (collection, key, record ,flags) => {
    if(typeof(flags) !=="number") flags = 0;

    if(typeof(collection) !=="string"
        || typeof(collection) !=="number"
        || collection.length < 1)
        return {"error":"No valid collection name given", "count":0};



            // Set default data storage area to OS temporary directory
            this.option.data_storage_area = fs.realpathSync(this.option.data_storage_area);



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
  Set options
\*========================================================================*/
rocketstore.setOptions = function(set_option){
    let success = true;
    // Format
    if( typeof(set_option.data_format) === "number" )
        if( set_option.data_format & (
                  rocketstore._FORMAT_JSON
                | rocketstore._FORMAT_XML )
        )
            rocketstore.option.data_format = set_option.data_format;
        else
            success = false;

    // Set native data format
    if( rocketstore.data_format == rocketstore._FORMAT_NATIVE )
        rocketstore.data_format = rocketstore._FORMAT_JSON;

    // Data storage area
    if( typeof(set_option.data_storage_area) === "string"){
        rocketstore.data_storage_area = set_option.data_storage_area;

        let dir = path.dirname(set_option.data_storage_area)
        console.log("path: " + dir);
        fs.access(dir, fs.constants.F_OK | fs.constants.W_OK, (err) => {
            if (err)
                console.error("Unable to write to " + dir);
            else
                console.log("Dir ok");
          
      });
    }
}

rocketstore.test = async () => {
    return {error: "All is well :)"};
}

rocketstore.test2 = function() {
    return {error: "All is well :)"};
}
