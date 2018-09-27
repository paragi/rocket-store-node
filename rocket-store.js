/*============================================================================*\
    Rocket Store (Rocket store)

    A very simple and yes powerfull flat file storage.

    (c) Paragi 2017, Simon Riget.

    License MIT
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
var rocketstore = function(options){

    rocketstore.options = {};

    // Validate and set options
    if( typeof(option.data_storage_area === "string")
        rocketstore.option.data_storage_area = option.data_storage_area;
    else
        rocketstore.option.data_storage_area =
              fs.realpathSync(os.tmpdir())
            + path.sep
            + "rocket_store"
            + path.sep
        ;

    if(    typeof(option.data_format) === "number"
        && option.data_format & ( RS_FORMAT_PHP | RS_FORMAT_JSON | RS_FORMAT_XML ) )
        rocketstore.option.data_format = option.data_forma;
    else
        rocketstore.option.data_format = RS_FORMAT_NATIVE;

    // Set native data format
    if( rocketstore.option.data_format == RS_FORMAT_NATIVE )
        rocketstore.option.data_format = RS_FORMAT_JSON;
};

module.exports = exports = rocketstore;

/*========================================================================*\
  Post a data record (Insert or overwrite)
\*========================================================================*/
public function post(collection, $key, record ,flags = 0){

}
/*========================================================================*\
  Get one or more records or list all collections (or delete it)
\*========================================================================*/
public function get(collection = '', key = '', min_time = null , max_time = null, flags = 0){

}
/*========================================================================*\
  Delete one or more records or collections
\*========================================================================*/
public function delete($collection = null, $key = null){
    return this->get(collection,key,null,null,RS_DELETE);
}
