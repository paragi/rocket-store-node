/*============================================================================*\
  Rocket store - test suite

  (c) Simon Riget 2017
  License MIT

  The number of concurent tasks might need tweeking to the individual system, to optimice persormance.

  This benchmark was tweeked for performance on an ordinary desk-top PC. But for comparability, the same settings are used on other devices.


  Some results:

  PHP: System: i7 3rd gen on SSD
  Mass insert: 31601/sec.
  Exact key search 1 hit: 25623/sec.
  Exact key search not found: 235735/sec.
  Wildcard key search 2 hits: 2.25/sec.
  Wildcard key delete 2 hits: 2.22/sec.
  Excat key delete 1 hits: 29852/sec.
  Delete collection: 44355/sec.

  Node: System: i7 3rd gen on SSD
  ┌─────────────────────────┬────────────────┐
  │ Mass insert:            │ '73104 /sec'   │
  ├─────────────────────────┼────────────────┤
  │ Exact key search 1 hit: │ '85778 /sec'   │
  └─────────────────────────┴────────────────┘


\*============================================================================*/
const rs = require('./rocket-store.js');
const fs = require('fs-extra');

const data_create = true;
const data_delete = false;
var data_size   = 1000000;
//data_size   = 100;

const record = [
  {
    name:   "Adam Smith",
    email:  "adam@smith.com",
    id:     1,
  },
  {
    name:   "Alice Smith",
    email:  "alice@smith.com",
    relatet: [1],
    id:     2,
  },
  {
    name:   "Bob Smith",
    email:  "bob@smith.com",
    relatet: [1,2],
    id:     3,
  },
  {
    name:   "Dave Canoly",
    email:  "dave@canoly.com",
    relatet: [4],
    id:     5,
  },
  {
    name:   "Charlie Canoly",
    email:  "charlie@canoly.com",
    relatet: [],
    id:     4,
  },
];


(async () => {try{
  var start, end;
  var stack1 = [];
  var stack2 = [];
  const collection = "person";
  benchmark = [];

  console.log("Collection dir:", rs.data_storage_area + collection);
  console.log("Bench mark test", "System: i7 3rd gen on SSD");

  if(data_create){
    console.time('Process time');
    console.log("Deleting test data if any");
    await fs.remove(rs.data_storage_area);
    console.timeEnd('Process time');
  }

  if(data_create) {
    console.log("Creating 1.000.000 test files. Please wait");
    console.time('Process time');
    start = Date.now();

    for( let i = 0; i < data_size/10; i++ ){
      for(let ii=0; ii < 20; ii++, i++)
        for( let r in record )
          stack1[stack1.length] = rs.post(collection,`${i}-${record[r]['id']}-${record[r]['name']}`,record[r]);
        if(stack2.length > 0) await Promise.all(stack2);
        stack2 = [];
      for(let ii=0; ii < 20; ii++, i++)
        for( let r in record )
          stack2[stack2.length] = rs.post(collection,`${i}-${record[r]['id']}-${record[r]['name']}`,record[r]);
        if(stack1.length > 0) await Promise.all(stack1);
        stack1 = [];
    }

    end = Date.now();

    benchmark["Mass insert:"] =  data_size / ((end-start)/1000) + " /sec";
    console.table(benchmark["Mass insert:"]);
    console.timeEnd('Process time');
  }

/*
  console.time('Exact key search 1 hit:');
    for( let i = 0; i < 10000; i++ )
      for( let r in record )
        rs.post(collection,`${record['id']}-${record['name']}`,record[r]);
*/

  console.log("Exact random key search: ");
  console.time('Process time');
  start = Date.now();

  for( let i = 0; i < data_size/10 ; i++ ){
    for(let ii=0; ii < 20; ii++, i++)
      for( let r in record )
        stack1[stack1.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-1-Adam Smith`);

      if(stack2.length > 0) await Promise.all(stack2);
      stack2 = [];

    for(let ii=0; ii < 20; ii++, i++)
      for( let r in record )
        stack2[stack2.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-1-Adam Smith`);
    if(stack1.length > 0) await Promise.all(stack1);
    stack1 = [];
  }

  end = Date.now();
  benchmark["Exact key search 1 hit:"] =  data_size / ((end-start)/1000) + " /sec";
    console.table(benchmark["Exact key search 1 hit:"]);
  console.timeEnd('Process time');

  console.table(benchmark);

  if(data_delete && false){
    console.time('Mass delete:');
    console.log("Deleting test data if any");
    await fs.remove(rs.data_storage_area);
    console.timeEnd('Mass delete:');
  }

}catch(err){
  console.error("some err:",err);
}})()


/*
if(true){
  echo "Exact key search 1 hit: ";

  $id = 1;
  $ts = microtime(true);

  for($c = 0; $c<10000; $c++){
    $result = $rs->get($collection, intval(substr(rand(),-5))  . "6-Adam Smith");
    if(!empty($result['error']) || $result['count'] != 1){
      echo "Failed: ";
      print_r($result);
      exit;
    }
  }

  $c--;
  echo $c / (microtime(true) - $ts) ."/sec.\n";
}


if(true){
  echo "Exact key search not found: ";

  $id = 1;
  $ts = microtime(true);

  for($c = 0; $c<10000; $c++){
    $result = $rs->get($collection, intval(substr(rand(),-5))  . "6-Adrian Smith");
    if(!empty($result['error']) || $result['count'] != 0){
      echo "Failed: ";
      print_r($result);
      exit;
    }
  }

  $c--;
  echo $c / (microtime(true) - $ts) ."/sec.\n";
}


if(true){
  echo "Wildcard key search 2 hits: ";

  $id = 1;
  $ts = microtime(true);

  for($c = 0; $c<5; $c++){
    $result = $rs->get($collection, intval(substr(rand(),-5))  . "?-Adam Smith");
    if(!empty($result['error']) || $result['count'] == 0){
      echo "Failed: ";
      print_r($result);
      exit;
    }
  }

  $c--;
  echo $c / (microtime(true) - $ts) ."/sec.\n";
}

if($delete){
  echo "Wildcard key delete 2 hits: ";

  $id = 1;
  $ts = microtime(true);

  for($c = 0; $c<5; $c++){
    $result = $rs->delete($collection, intval(substr(rand(),-5))  . "?-Adam Smith");
    if(!empty($result['error']) || $result['count'] == 0){
      echo "Failed: ";
      print_r($result);
      exit;
    }
  }

  $c--;
  echo $c / (microtime(true) - $ts) ."/sec.\n";
}

if($delete){
  echo "Excat key delete 1 hits: ";

  $id = 1;
  $ts = microtime(true);

  for($c = 0; $c<5; $c++){
    $result = $rs->delete($collection, intval(substr(rand(),-5))  . "6-Adam Smith");
    if(!empty($result['error']) || $result['count'] == 0){
      echo "Failed: ";
      print_r($result);
      exit;
    }
  }

  $c--;
  echo $c / (microtime(true) - $ts) ."/sec.\n";
}

if($delete){
  echo "Delete collection: ";

  $id = 1;
  $ts = microtime(true);
  $result = $rs->delete($collection);
  if(!empty($result['error']) || $result['count'] == 0){
    echo "Failed: ";
    print_r($result);
    exit;
  }
  echo $result['count'] / (microtime(true) - $ts) ."/sec.\n";
}
*/
