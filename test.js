/*
  NB: The node file system code has a serious issue with large directories.

  All this should go away when the node core team implements better methods for iterating over directory entries.
  For instance, if it becomes able to process wildcards on a lower level and/or stream directory entries.

  Node file system return an array of all filenames in a directory. This is higly inappropriate in an mature language.
  There is no other way around it, other than using another binary library function than libuv.

  The approach taken here, is to implement rocket-store anyway, in the hope that it will be remedied soon.
  There is a bug report discussing the issue here: https://github.com/nodejs/node/issues/583

  The issue resides in https://github.com/nodejs/node/blob/master/src/node_file.cc


  Approach with node implementation:

  Since all wildcard searches will use readdir, we might aswell take advantage of the already allocated data, and reuse it for speed.

  This means that memory size limits the number of records, to a collection. Typically no less than 80 bytes pr. entry.

  Increase node memory limit with the option --max-old-space-size=n (in kB)
    ex  node --max-old-space-size=8192 server.js

  Also some memory optimizations and considerations are added.


  Optimization:

  NB: This will be removed when the node file system functions has matured.

  Memory optimizing and garbage collection is based on a few assumtions, that hopefully suits most use cases.

  Assuming an avarage filename size of 200 bytes.

  using v8.getHeapSpaceStatistics() to gauge the amount of available memory.
    v8.getHeapSpaceStatistics()[5].space_available_size

  Don't bother with arrays smaller than 1% ( set with optimice_larger_than )

  be more agressive when free memory is low
  be more agressive when cash is seldom used

  When removing a large array, setting it to null is the way to go.

  NB: Javascript associative arrays are objects. Therefore there are restrictions on the use of key names:

  The first character must be a letter or an underscore.
  The rest of the name can't be anything other than letters, numbers, or underscores.

  Therefore the results returned consist of two arrays:
    key and record, whos indexes correspond.

*/


const rs = require('./rocket-store.js');
const fs = require('fs-extra');
const v8 = require('v8');
const os = require('os');

function assert(condition, message) {
  if(!condition){
    console.group(`Assertion failed: ${message}`);
    console.trace();
    console.groupEnd();
    process.exit(-1);
  }
}

objectHas = function(big, small){
  if( typeof small === 'undefined' ) return true;
  if( ( small === null ) !== ( big === null ) ) return false;
  if( typeof small !== typeof big ) return false;
  if( typeof small === 'object')
    for (var p in small){
      if(!objectHas(big[p], small[p])) return false;
    }
  else if (small !== big) return false;
  return true;
}

osIsWindows = os.platform() == 'win32';

async function tst(description,func,parameters,expected_result){
  tst.tests++;
  assert(typeof description !== "String"
    ,"Parameter 1 description must be a string");
  assert(typeof func !== "Function","Parameter 2 func must be a function");
  assert(typeof parameters !== "Object"
    ,"Parameter 3 parameters must be an array object");

  try{
    var result = await func(...parameters);
  } catch(err) {
    result = err.message;
  }

  failed = !objectHas(result, expected_result);

  if(failed){
    tst.failed++
    console.group("\x1b[31mFailed\x1b[0m: " + description);
    console.log("Parameters: ", parameters);
    console.log("Expected:",expected_result);
    console.log("got:", result);
    console.trace();
  }else{
    console.group("\x1b[32mOK\x1b[0m: " + description);
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

  fs.remove(rs.data_storage_area);

  // Save default values
  let defaults = {
    data_format         : rs.data_format,
    data_storage_area   : rs.data_storage_area,
  }

  // options
  await tst(
    "Bad data format option",
    rs.options,
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
    "Set options to unwritable directory",
    rs.options,
    [{data_storage_area: "/rsdb/sdgdf/",data_format: rs._FORMAT_NATIVE}],
    "Unable to create data storage directory '/rsdb/sdgdf': ",
  );

  await tst(
    "Set options",
    rs.options,
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

  record.test = 27;
  await tst(
    "Repost a record",
    rs.post,
    ["person",`${record['id']}-${record['name']}`,record],
    { key: '22756-Adam Smith', count: 1 },
  );

  await tst(
    "Count record",
    rs.get,
    ["person",`${record['id']}-${record['name']}`],
     { count: 1,
    key: [ '22756-Adam Smith' ],
    result:
     [ { id: '22756',
         name: 'Adam Smith',
         title: 'developer',
         email: 'adam@smith.com',
         phone: '+95 555 12345',
         zip: 'DK4321',
         country: 'Distan',
         address: 'Elm tree road 555',
         test: 27 }]
    },
  );

  await tst(
    "Post a record with empty key",
    rs.post,
    ["person","",record],
    { key: '1', count: 1 },
  );

  await tst(
    "Post a record with auto incremented value added to key",
    rs.post,
    ["person","key",record,rs._ADD_AUTO_INC],
    { key: '2-key', count: 1 },
  );

  await tst(
    "Post a record with auto incremented key only",
    rs.post,
    ["person","",record,rs._ADD_AUTO_INC],
    { key: '3', count: 1 },
  );

  await tst(
    "Post a record with empty collection",
    rs.post,
    ["","bad",record],
    'No valid collection name given',
  );

  await tst(
    "Post a record with collection name that contains illegal chars",
    rs.post,
    ["\x00./.\x00","bad",record],
    'Collection name contains illegal characters (For a javascript identifier)',
  );

  await tst(
    "Post a record with GUID added to key",
    rs.post,
    ["person","key-value",record,rs._ADD_GUID],
    { count: 1 },
  );

  await tst(
    "Post a record with GUID key only",
    rs.post,
    ["person","",record,rs._ADD_GUID],
    { count: 1 },
  );

  record['id']++;
  await tst(
    "Post invalid collection",
    rs.post,
    ["person?<|>*\":&~\x0a",`${record['id']}-${record['name']}`,record],
    'Collection name contains illegal characters (For a javascript identifier)',
  );

  record['id']++;
  if( osIsWindows )
    await tst(
      "Post invalid key",
      rs.post,
      ["person",`x?<|>*\":\x0a${record['id']}-${record['name']}`,record],
      { key: 'x22758-Adam Smith', count: 1 },
    );
  else
    await tst(
      "Post invalid key",
      rs.post,
      ["person",`x?<|>*\":&~\x0a${record['id']}-${record['name']}`,record],
      { key: 'x<|>":&\n22758-Adam Smith', count: 1 },
    );

  // Get
  await tst(
    "Get with exact key",
    rs.get,
    ["person",`22756-${record['name']}`],
    { count: 1, key: [ '22756-Adam Smith' ] },
  );

  await tst(
    "Get exact key no hit (no cash)",
    rs.get,
    ["person",`${record['id']}-${record['name']}X`],
    { count: 0 },
  );

  await tst(
    "Get with wildcard in key",
    rs.get,
    ["person",`22*-${record['name']}`],
    { count: 1, key: [ '22756-Adam Smith' ] },
  );
  
  await tst(
    "Get exact key no hit",
    rs.get,
    ["person",`${record['id']}-${record['name']}X`],
    { count: 0 },
  );

  await tst(
    "Get wildcard in key with no hit",
    rs.get,
    ["person",`*-${record['name']}X`],
    { count: 0 },
  );

  await tst(
    "Get a list",
    rs.get,
    ["person","*"],
    { count: 7 },
  );

  await tst(
    "Get a list of collections and sequences",
    rs.get,
    [],
    { count: 4 },
  );

  await tst(
    "Get list of sequences with wildcard",
    rs.get,
    [null, "*_seq"],
    { count: 2 },
  );

  record['id']++;
  await tst(
    "Post collection as number ",
    rs.post,
    [33,`${record['id']}-${record['name']}`,record],
    'Collection name contains illegal characters (For a javascript identifier)',
  );

  await tst(
    "Get collections as a number",
    rs.get,
    [33],
    'Collection name contains illegal characters (For a javascript identifier)'
,
  );

  // Test order_by flags
  await rs.post("person","p1",1);
  await rs.post("person","p4",4);
  await rs.post("person","p2",2);
  await rs.post("person","p3",3);

  // compare order of array values
  function test_order(arr1, arr2){
    for(let i in arr1)
      if(arr1[i] != arr2[i])
        return false;
    return true;
  }

  result = await rs.get("person","p?",rs._ORDER);

  await tst(
    "Get order ascending",
    test_order,
    [result.record,[ 1, 2, 3, 4 ]],
    true,
  );

  await tst(
    "Get keys",
    rs.get,
    ["person","p?",rs._KEYS],
    { count: 4 },
  );

  result = await rs.get("person","p?",rs._ORDER_DESC | rs._KEYS);
  await tst(
    "Get keys in descending order",
    test_order,
    [result.key,[ 'p4', 'p3', 'p2', 'p1']],
    true,
  );

  result = await rs.get("person","p?",rs._ORDER | rs._KEYS);
  await tst(
    "Get keys in ascending order",
    test_order,
    [result.key,[ 'p1', 'p2', 'p3', 'p4']],
    true,
  );

  await tst(
    "Get record count",
    rs.get,
    ["person","p?",rs._COUNT],
    { count: 4 },
  );

  await fs.remove(`${rs.data_storage_area}/person/p2`);
  await tst(
    "Get manually deleted record where keys != cache",
    rs.get,
    ["person","p?"],
    { count: 3, key: [ 'p1', 'p4', 'p3' ], result: [ 1, 4, 3 ] },
  );

  await fs.remove(`${rs.data_storage_area}/person/'22756-Adam Smith'`);
  await tst(
    "Get manually deleted record where keys == cache",
    rs.get,
    ["person","*"],
    { count: 10 },
  );


  let key = "No Smith";
  await rs.delete("person");
  await rs.post("person",key, "should be ok");
  await fs.outputFile(`${rs.data_storage_area}/person/${key}`,"not a JSON{");
  await tst(
    "Get invalid JSON in file",
    rs.get,
    ["person"],
    { count: 1, key: [ 'No Smith' ], result: [ '' ] },
  );

  // test time limits
  // test Json and XML

  // Delete
  await rs.post("delete_fodders1","",record);
  await rs.post("delete_fodders1","",record);
  await rs.post("delete_fodders1","",record);
  await rs.post("delete_fodders2","",record);
  await rs.post("delete_fodders3","",record);

  await tst(
    "Delete record with exact key",
    rs.delete,
    ["delete_fodders1",1],
    { count: 1 },
  );

  await tst(
    "Delete collection",
    rs.delete,
    ["delete_fodders1"],
    { count: 2 },
  );

  await tst(
    "Delete nonexistent collection",
    rs.delete,
    ["delete_fodders1"],
    { count: 0 },
  );

  await tst(
    "Delete collection with wildcard" ,
    rs.delete,
    ["","*fodders?"],
    { count: 2 },
  );

  await tst(
    "Delete numeric collection" ,
    rs.delete,
    ["1"],
    'Collection name contains illegal characters (For a javascript identifier)',
  );

  await tst(
    "Delete sequence" ,
    rs.delete,
    ["","delete_fodders2_seq"],
    { count: 1 },
  );


  await tst(
    "Delete sequence" ,
    rs.delete,
    ["","delete_fodders*"],
    { count: 1 },
  );

  await tst(
    "Delete unsafe ../*",
    rs.delete,
    ["delete_fodders2/../*"],
    'Collection name contains illegal characters (For a javascript identifier)',
  );

  await tst(
    "Delete unsafe ~/*" ,
    rs.delete,
    ["~/*"],
    'Collection name contains illegal characters (For a javascript identifier)',
  );


  // Test asynchronous object integrity
  let i;
  let obj = {}
  let promises = [];

  for( i = 0; i<4; i++ ){
    obj.id = i;
    promises.push( rs.post("async",i,obj) );
  }

  await Promise.all(promises);

  await tst(
    "Post test asynchronous integrity of records" ,
    rs.get,
    ["async","",rs._ORDER_ASC],
    {
      count: 4,
      key: [ '0', '1', '2', '3' ],
      result: [
        { id: 0 },
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ]
    }
  );


  await tst(
    "Delete database" ,
    rs.delete,
    [],
    { count: 1 },
  );

  await tst.sum();
};

testcases();

var collection = 'person';

const strange_keys = [
  '.test',
  '..test',
  '.{te}st',
  '..<{te}st>|',
  '      t',
  't{es|t,ing}',
  't{es|t,ing}',
  "test/a/**/[cg]/../[cg]",
  'btest',
  'atest',
];

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


const new_test_files = async () => {
  await fs.remove(rs.data_storage_area);

/*

  for( let i in strange_keys)
    try{
      rs.post("person",strange_keys[i],record);
    } catch(err) {
      console.log(err);
    }

*/


  // Fejler! fix later
  for( let i = 0;i < 10; i++)
    try{
      await rs.post("person","",record,rs._ADD_AUTO_INC);
    } catch(err) {
      console.log(err);
    }

/*
  for( let i = 1;i <10; i++)
    try{
      await rs.post("person","x" + i,record);
    } catch(err) {
      console.error(err);
    }
*/
}
//new_test_files();

/*
(async () => {try{


  var search,list ;

  console.log("Available memory",Math.round( v8.getHeapSpaceStatistics()[5].space_available_size / (1024 * 1024)), "MB")

  console.table(process.memoryUsage());
  console.log("memory usage:", 100 * os.freemem() / os.totalmem(),'%');

  //await fs.remove(rs.data_storage_area );

  console.log("Get *",await rs.get('person','*'));

  //console.log("Get seq = ",await rs.sequence('test_file2'));
  //console.log("Get seq = ",await rs.sequence('test_file2'));

  // Determine if the array is large enough to optimize
  // Assume a path lenght of 200 bytes
  const optimice_larger_than = 0.1 // %
  const optimice_length =
    parseInt( (v8.getHeapSpaceStatistics()[5].space_available_size / 20000 ) * optimice_larger_than );

  console.log("optimice_length",optimice_length);

  console.log("Available memory",Math.round( v8.getHeapSpaceStatistics()[5].space_available_size / (1024 * 1024)), "MB")

}catch(err){
  console.error("some err:",err);
}})()
*/
