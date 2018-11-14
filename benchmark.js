/*============================================================================*\
  Rocket store - test suite

  (c) Simon Riget 2017
  License MIT

  The number of concurent tasks might need tweeking to the individual system, to optimice persormance.

  This benchmark was tweeked for performance on an ordinary desk-top PC. But for comparability, the same settings are used on other devices.


  Some results:

  PHP on i7 3rd gen on SSD
  ┌───────────────────────────────────┬─────────────┐
  │ Mass insert                       │ 31601 /sec  │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random key search           │ 25623 /sec  │
  ├───────────────────────────────────┼─────────────┤
  │ Exact ramdom key search no hit    │ 235735 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search 2 hits │ 2.25 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search no hit │             │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom delete 2 hits     │ 2.22 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random delete               │ 29852 /sec  │
  └───────────────────────────────────┴─────────────┘


  Nodeon i7 3rd gen on SSD
  ┌───────────────────────────────────┬─────────────┐
  │ Mass insert                       │ 69434 /sec  │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random key search           │ 86775 /sec  │
  ├───────────────────────────────────┼─────────────┤
  │ Exact ramdom key search no hit    │ 123304 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search 2 hits │ 14.6 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search no hit │ 15.5 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom delete 2 hits     │ 15.5 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random delete               │ 325.7 /sec  │
  └───────────────────────────────────┴─────────────┘

  Node on Raspbarry Pi Zero
  ┌───────────────────────────────────┬─────────────┐
  │ Mass insert                       │ 561 /sec    │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random key search           │ 96 /sec     │
  ├───────────────────────────────────┼─────────────┤
  │ Exact ramdom key search no hit    │ 147 /sec    │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search 2 hits │ 0.27 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search no hit │ 0.27 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom delete 2 hits     │ 0.29 /sec   │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random delete               │ 10.3 /sec   │
  └───────────────────────────────────┴─────────────┘

\*============================================================================*/
const rs = require('./rocket-store.js');
const fs = require('fs-extra');

const data_create = true;
const data_delete = false;
var data_size   = 1000000;


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

/*===========================================================================*/

  if(data_create){
    test_name = "Mass insert";

    console.time('Process time');
    console.log("Deleting test data if any");
    await fs.remove(rs.data_storage_area);
    console.timeEnd('Process time');

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
  benchmark[test_name] =  data_size / ((end-start)/1000) + " /sec";
    console.table(benchmark[test_name]);
  console.timeEnd('Process time');
  }

/*===========================================================================*/

  test_name = "Exact random key search";
  console.log(test_name);
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
  benchmark[test_name] =  (data_size/10) / ((end-start)/1000) + " /sec";
    console.table(benchmark[test_name]);
  console.timeEnd('Process time');

/*===========================================================================*/

  test_name = "Exact ramdom key search no hit";
  console.log(test_name);
  console.time('Process time');
  start = Date.now();

  for( let i = 0; i < data_size/10 ; i++ ){
    for(let ii=0; ii < 20; ii++, i++)
      for( let r in record )
        stack1[stack1.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-1-XAdam Smith`);

      if(stack2.length > 0) await Promise.all(stack2);
      stack2 = [];

    for(let ii=0; ii < 20; ii++, i++)
      for( let r in record )
        stack2[stack2.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-1-XAdam Smith`);
    if(stack1.length > 0) await Promise.all(stack1);
    stack1 = [];
  }

  end = Date.now();
  benchmark[test_name] =  (data_size/10) / ((end-start)/1000) + " /sec";
    console.table(benchmark[test_name]);
  console.timeEnd('Process time');

/*===========================================================================*/

  test_name = "Wildcard ramdom key search 2 hits";

  // Fill cash
  await rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Canoly`);

  console.log(test_name);
  console.time('Process time');
  start = Date.now();

  // Fill cash
  await rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Canoly`);

  for( let i = 0; i < 40 ; i++ ){
    for(let ii=0; ii < 20; ii++, i++)
        stack1[stack1.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Canoly`);

      if(stack2.length > 0) await Promise.all(stack2);
      stack2 = [];

    for(let ii=0; ii < 20; ii++, i++)
        stack2[stack2.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Canoly`);
    if(stack1.length > 0) await Promise.all(stack1);
    stack1 = [];
  }

  end = Date.now();
  benchmark[test_name] =  41 / ((end-start)/1000) + " /sec";
    console.table(benchmark[test_name]);
  console.timeEnd('Process time');

/*===========================================================================*/

  test_name = "Wildcard ramdom key search no hit";

  console.log(test_name);
  console.time('Process time');
  start = Date.now();

  for( let i = 0; i < 40 ; i++ ){
    for(let ii=0; ii < 20; ii++, i++)
        stack1[stack1.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Spanoly`);

      if(stack2.length > 0) await Promise.all(stack2);
      stack2 = [];

    for(let ii=0; ii < 20; ii++, i++)
        stack2[stack2.length]
          = rs.get(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Spanoly`);
    if(stack1.length > 0) await Promise.all(stack1);
    stack1 = [];
  }

  end = Date.now();
  benchmark[test_name] =  40 / ((end-start)/1000) + " /sec";
    console.table(benchmark[test_name]);
  console.timeEnd('Process time');

/*===========================================================================*/

  test_name = "Wildcard ramdom delete 2 hits";

  console.log(test_name);
  console.time('Process time');
  start = Date.now();

  for( let i = 0; i < 40 ; i++ ){
    for(let ii=0; ii < 20; ii++, i++)
      stack1[stack1.length]
        = rs.delete(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Canoly`);

    if(stack2.length > 0) await Promise.all(stack2);
    stack2 = [];

    for(let ii=0; ii < 20; ii++, i++)
      stack2[stack2.length]
        = rs.delete(collection,`${Math.floor(Math.random() * data_size/5)}-?-*Canoly`);
    if(stack1.length > 0) await Promise.all(stack1);
    stack1 = [];
  }

  end = Date.now();
  benchmark[test_name] =  40 / ((end-start)/1000) + " /sec";
    console.table(benchmark[test_name]);
  console.timeEnd('Process time');

/*===========================================================================*/

  test_name = "Exact random delete";

  console.log(test_name);
  console.time('Process time');
  start = Date.now();

  for( let i = 0; i < 100 ; i++ ){
    for(let ii=0; ii < 5; ii++, i++)
      stack1[stack1.length]
        = rs.delete(collection,`${Math.floor(Math.random() * data_size/5)}-3-Bob Smith`);

    if(stack2.length > 0) await Promise.all(stack2);
    stack2 = [];

    for(let ii=0; ii < 5; ii++, i++)
      stack2[stack2.length]
        = rs.delete(collection,`${Math.floor(Math.random() * data_size/5)}-3-Bob Smith`);
    if(stack1.length > 0) await Promise.all(stack1);
    stack1 = [];
  }

  end = Date.now();
  benchmark[test_name] = 100 / ((end-start)/1000) + " /sec";
    console.table(benchmark[test_name]);
  console.timeEnd('Process time');

/*===========================================================================*/


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
