rs = require('./rocket-store.js');
const fs = require('fs-extra');

function assert(condition, message) {
    if(!condition){
        console.group(`Assertion failed: ${message}`);
        console.trace();
        console.groupEnd();
        process.exit(-1);
    }
}

async function tst(describtion,func,parameters,expected_result){
    tst.tests++;
    assert(typeof describtion !== "String"
        ,"Parameter 1 describtion must be a string");
    assert(typeof func !== "Function","Parameter 2 func must be a function");
    assert(typeof parameters !== "Object"
        ,"Parameter 3 parameters must be an array object");

    try{
        var result = await func(...parameters);
    } catch(err) {
        result = err.message;
    }

    let failed = false;

    if( typeof expected_result !== typeof result )
        failed = true;

    else
        if( typeof result === "object" ){
            for( let i in expected_result)
                if( typeof result[i] != "undefined" && result[i] != expected_result[i] ){
                    failed = true;
                    break;
                }
        }else{
            if( result != expected_result )
            failed = true;
        }

    if(failed){
        tst.failed++
        console.group("\x1b[31mFailed\x1b[0m: " + describtion);
        console.log("Ecpected:",expected_result);
        console.log("got:", result);
        console.trace();
    }else{
        console.group("\x1b[32mOK\x1b[0m: " + describtion);
    }
    console.groupEnd();
}

tst.tests  = 0;
tst.failed = 0;

tst.sum = function(){
    console.table({
        Tests: tst.tests,
        Failed: tst.failed,
    });
}


testcases = async () => {
    console.log(`${"=".repeat(80)}\n`
        + `${" ".repeat(37)}Testing\n`
        + `${"=".repeat(80)}`
    );

    // Save default values
    let defaults = {
        data_format         : rs.data_format,
        data_storage_area   : rs.data_storage_area,
    }

    // setOptions
    await tst(
        "Bad data format option",
        rs.setOptions,
        [{data_storage_area: "./",data_format: "a"}],
        "Unknown data format: 'a'",
    );

    await tst(
        "Set options on main object",
        rs,
        [{data_storage_area: "./rs/sdgdf/",data_format: rs._FORMAT_NATIVE}],
        rs,
    );

    fs.remove("./rs")

    await tst(
        "Set options to unwriteable directory",
        rs.setOptions,
        [{data_storage_area: "/rsdb/sdgdf/",data_format: rs._FORMAT_NATIVE}],
        "EACCES: permission denied, mkdir '/rsdb'",
    );

    await tst(
        "Set options",
        rs.setOptions,
        [defaults],
    );
    console.table(defaults);

    // Post and sequence
    let record = {
        id          : "22756",
        name        : "Adam Smith",
        title       : "developer",
        email       : "adam@smith.com",
        phone       : "+95 555 12345",
        zip         : "DK4321",
        country     : "Distan",
        address     : "Elm tree road 555",
    };

    await tst(
        "Post a record",
        rs.post,
        ["person",`${record['id']}-${record['name']}`,record],
        { key: '22756-Adam Smith', count: 1 },
    );

    fs.remove(`${rs.data_storage_area}/first_seq`);

    await tst(
        "Create a sequence",
        rs.sequence,
        ["first"],
        1,
    );

    await tst(
        "Increment sequence",
        rs.sequence,
        ["first"],
        2,
    );

    await tst(
        "Post a record, where key is empty",
        rs.post,
        ["person","",record],
        { count: 1 },
    );

    await tst(
        "Post with auto incremented added to key",
        rs.post,
        ["person","key",record,rs._ADD_AUTO_INC],
        { count: 1 },
    );

    await tst(
        "Post with auto incremented key only",
        rs.post,
        ["person","",record,rs._ADD_AUTO_INC],
        { count: 1 },
    );

    await tst(
        "Post a record, where collection is empty",
        rs.post,
        ["","bad",record],
        'No valid collection name given',
    );

    await tst(
        "Post a record, where collection name only has illigal chars",
        rs.post,
        ["\x00./.\x00","bad",record],
        'No valid collection name given',
    );

    const sanitize = require("sanitize-filename");
    console.log("->" + sanitize("com1:") + "<-");
    // displays: -><-

    // get


     /*

    test("Get with exact key"
        ,$rs->get($collection,"{$record['id']}-{$record['name']}")
        ,1
    );

    test("Get with wildcard in key"
        ,$rs->get($collection,"22*-{$record['name']}")
        ,1
    );

    test("Get exact key no hit"
        ,$rs->get($collection,"{$record['id']}-{$record['name']}X")
        ,0
    );

    test("Get wildcard in key with no hit"
        ,$rs->get($collection,"*-{$record['name']}X")
        ,0
    );

    $record['id']++;
    $rs->post("$collection?<|>*\":&~\x0a","{$record['id']}-{$record['name']}",$record);
    test("Post invalid collection"
        ,$rs->get($collection,"{$record['id']}-{$record['name']}")
        ,1
    );

    $record['id']++;
    $rs->post($collection,"{$record['id']}-?<|>*\":&~\x0a{$record['name']}",$record);
    test("Post invalid key"
        ,$rs->get($collection,"{$record['id']}-{$record['name']}")
        ,1
    );

    test("Get a list"
        ,$rs->get($collection,"*")
        ,6
    );

    test("Get a list entire collection"
        ,$rs->get($collection)
        ,6
    );

    test("Get a list of collections and sequences"
        ,$rs->get()
        ,2
    );


    test("Get list of matching collections"
        ,$rs->get(null, "*_seq")
        ,1
    );


    test("Delete record with exact key"
        ,$rs->delete($collection,"{$record['id']}-{$record['name']}")
        ,1
    );


    // Test order_by flags
    // test time limits
    // test Json and XML


    // Make some delete fodder
    $rs->post($collection."1","",$record);
    $rs->post($collection."2","",$record);
    $rs->post($collection."3","",$record);

    test("Delete collection"
        ,$rs->delete($collection ."1")
        ,1
    );

    test("Safe delete ../*"
        ,$rs->delete(
              $collection ."2"
            . DIRECTORY_SEPARATOR
            . ".."
            . DIRECTORY_SEPARATOR
            . "*"
        )
        ,1
    );

    test("Safe delete ~/*"
        ,$rs->delete(
              $collection ."3"
            . DIRECTORY_SEPARATOR
            . ".."
            . DIRECTORY_SEPARATOR
            . "~/*"
        )
        ,1
    );

    test("Delete sequence along with collection"
        ,["error" => "", "count" => $rs->sequence("{$collection}1_seq") ]
        ,1
    );

    test("Safe delete all"
        ,$rs->delete()
        ,7
    );
    */

    //fs.remove(rs.data_storage_area);

    await tst.sum();
};

//testcases();

/*
(async () => {
try{
    await rs.setOptions({data_storage_area: "./",data_format: "a"});
} catch(err){
    console.error("Operation failed:",err.message);
}

try{
    await rs({data_storage_area: "./rs/sdgdf/",data_format: rs._FORMAT_NATIVE});
    console.table({data_storage_area : rs.data_storage_area
                    ,data_format: rs.data_format});
    await rs.setOptions({data_storage_area: "./",data_format: rs._FORMAT_NATIVE});
    console.table({data_storage_area : rs.data_storage_area
                    ,data_format: rs.data_format});
    await rs({data_format: rs._FORMAT_NATIVE});
    console.table({data_storage_area : rs.data_storage_area
                    ,data_format: rs.data_format});

} catch(err){
    console.error("Operation failed:", err);
    return
}

})();

//console.log(rs);

const toben = function(){
    toben.a = 1;
    toben.b = 2;
    toben.c = 0;
}

toben.sum = async (n) => {
    await new Promise((resolve, reject) => {
        setTimeout(() => {

            resolve();
        }, 1000)
    });
    toben.c = toben.a + toben.b + toben.c + n;
    console.table([toben.a, toben.b, toben.c,]);
    await* promises;
}

treben = async (v) => {
    await toben.sum(v);
    console.table("treben",[toben.a, toben.b, toben.c,]);
}

toben();

toben.sum(2);
toben.sum(5);

tt = () => {
    console.log("tt Start");
    const promise = new Promise((resolve, reject) => {
        setTimeout(() => {resolve();}, 1000)
    });
    console.log("tt promise returned");

    promise.then( () =>{
        console.log("tt in promise then");
    });

    console.log("tt ending");
};

tt();
*/


const fg = require('fast-glob');
const path = require('path');

const glob_options = {
    deep: 1,
    dot: true,
    brace: false,
    extension: false,
}

var collection = 'person';


fs.outputJson(
    rs.data_storage_area
    + path.sep
    + collection
    + path.sep
    + '.test'
    , {record: "test data"}
);

fs.outputJson(
    rs.data_storage_area
    + path.sep
    + collection
    + path.sep
    + '..test'
    , {record: "test data"}
);

fs.outputJson(
    rs.data_storage_area
    + path.sep
    + collection
    + path.sep
    + '.{te}st'
    , {record: "test data"}
);

fs.outputJson(
    rs.data_storage_area
    + path.sep
    + collection
    + path.sep
    + '..<{te}st>|'
    , {record: "test data"}
);

fs.outputJson(
    rs.data_storage_area
    + path.sep
    + collection
    + path.sep
    + '      t'
    , {record: "test data"}
);

fs.outputJson(
    rs.data_storage_area
    + path.sep
    + collection
    + path.sep
    + 't{es|t,ing}'
    , {record: "test data"}
);

/*
  NB: A note on memory usages:

  The node implementation of rocket-store, cashes all filenames of a collection, in memory.

  On a filesystem with many files (10^6+) it consumes a lot of memory to store all filenames in an array.

  As of node v10, the readdir function will return an array of all files in a directory. There is no other way around it, than using another binary library function than libuv.

  Since all wildcard searches will use readdir, we might aswell take advantage of the already allocated data, and reuse it for speed.

  The cashing functionality will probably be removed, when node fs has matured, to only return one filename, at a time.

  Until then memory size limits the number of records, to a collection.

*/

//const path = require('path');
const globToRegExp = require('glob-to-regexp');

var key_cash ={};

const get = async ( pattern ) => {
  let glob;
  let list = [];

  // With wildcards
  if( pattern.indexOf('*') > -1 || pattern.indexOf('?') > -1 ) {
    //glob = pattern.replace(/[*]{2,}/g, ''); // No globstars**
    // fileNameWash

    key_cash[collection] =
      await fs.readdir(rs.data_storage_area + '/' + collection);
    let regex = globToRegExp(pattern);

console.log("Search for:", pattern,regex);
//console.table(key_cash[collection]);

    for( let i in key_cash[collection])
      if( regex.test(key_cash[collection][i]) )
        list[list.length] = key_cash[collection][i] // 10 x faster than push etc.

  // Without wildcards
  } else {
    list = [ pattern ];
  }

  return list;
/*

var glob = rs.data_storage_area + '/' + collection //+ '/' + search;
console.log("Search for:", glob);
fs.readdir(glob,glob_options)
.then((entries) => console.log(1,entries))
.catch((err) => console.error(err));


    for( let file in list ){
          let filehandle;
          try {
            filehandle = await fs.open('thefile.txt', 'r');
          } finally {
            if (filehandle !== undefined)
              await filehandle.close();
          }
        }

        fs.readFile('/etc/passwd', 'utf8', callback);
        filehandle.readFile(options)

        Added in: v10.0.0

            options <Object> | <string>
                encoding <string> | <null> Default: null
    }

    .then((entries) => console.log(1,entries));
*/

}

var search;
search = "*test"; get(search).then((entries) => console.log(search,console.table(entries)));
//search = "?*"; get(search).then((entries) => console.log(search,entries));
//search = "test-ole"; get(search).then((entries) => console.log(search,entries));

/*
search = "t{es|t,ing}";
glob = rs.data_storage_area + '/' + collection + '/' + search;
console.log("Search for:", glob);
fg(glob,glob_options).then((entries) => console.log(2,entries));
*/

//fg.async(['src/**/*.js', '!src/**/*.spec.js'])
//.then((entries) => console.log(entries));

console.table(process.memoryUsage());
