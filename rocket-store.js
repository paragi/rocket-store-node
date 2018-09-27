/*============================================================================*\
    Rocket Store (Rocket store)

    A very simple and yes powerfull flat file storage.

    (c) Paragi 2017, Simon Riget.

    License MIT

    Usages:

    const rocketstore = require('rocket-store');
    rs = new rocketstore( options );

    result = rs.post( collection, key, record [, options])
    result = rs.get( collection, key [, options])
    result = rs.delete( collection, key)

\*============================================================================*/
var fs = require('fs');
var os = require('os');
var path = require('path');

// Get options
const RS_ORDER        = 0x01;
const RS_ORDER_DESC   = 0x02;
const RS_ORDERBY_TIME = 0x04;
const RS_LOCK         = 0x08;
const RS_DELETE       = 0x10;

// Post options
const RS_ADD_AUTO_INC = 0x40;

// Data storage format options
const RS_FORMAT_JSON  = 0x01;
const RS_FORMAT_NATIVE= 0x02;
const RS_FORMAT_XML   = 0x04; // Not implemened
const RS_FORMAT_PHP   = 0x08;

// Define module object
const rocketstore = function(set_option){

    this.option = {
         data_format:        RS_FORMAT_NATIVE
        ,data_storage_area:  os.tmpdir() + path.sep + "rocket_store" + path.sep
    };

    // Validate and set options
    if( typeof(set_option) !== "undefined") {
        if( typeof(set_option.data_storage_area) === "string")
            this.option.data_storage_area = set_option.data_storage_area;

        if(    typeof(set_option.data_format) === "number"
            && set_option.data_format & ( RS_FORMAT_PHP | RS_FORMAT_JSON | RS_FORMAT_XML ) )
            this.option.data_format = set_option.data_format;
    }

    // Set native data format
    if( this.option.data_format == RS_FORMAT_NATIVE )
        this.option.data_format = RS_FORMAT_JSON;
};

module.exports = exports = rocketstore;

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
    return this->get(collection,key,null,null,RS_DELETE);
}
*/


rocketstore.test = async () => {
    return {error: "All is well :)"};
}

rocketstore.test2 = function() {
    return {error: "All is well :)"};
}

rs = new rocketstore({data_storage_area: "./",data_format: RS_FORMAT_NATIVE});

console.log(rs.test2());
