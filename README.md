# Rocket Store
**Using the filesystem as a searchable database.**

Rocket-store is high performance solution to simple data storage and retrieval. It's taking advantage of modern file systems exceptionally advanced cashing mechanisms.

It's packaged in a single file to include, with few dependencies.

Rocket-store is also available for PHP.

## Simple to use:
```javascript
result = await rs.post(
  "cars",
  "Mercedes",
  {
    owner: "Lisa Simpson",
    registration: "N3RD"
  }
);

result = await rs.get("cars","*",rs._ORDER_DESC);

result = await rs.delete("cars","*cede*");

```

## Features:
* Extremely fast
* Very reliant
* Very little footprint. (except for
* Very flexible.
* few dependencies
* Works without configuration or setup.
* Data stored in JSON format
* Configurable


## Installation

    npm install rocket-store


### Post
Stores a record, in <directory\> with in <filename\>

```javascript
post(string <directory\>, string <filename\>, array | scalar <data\> [, integer options])
```
* Directory name to contain the collection of file records. (Directories are located in the storage area, that can be set with the options method. Defaults to <tempdir>/rsdb )
* File name of the record
No path separators or wildcards are allowed in directory or file names
* Options:
  * RS_ADD_AUTO_INC:  Add an auto incremented sequence to the beginning of the file name

Returns an array containing the result of the operation:
* key:   string containing the actual file name used
* count : number of files affected (1 on succes)

If the file already exists, the record will be replaced.

Subdirectories and full path is not supported. Path separators and other illigal charakters are silently striped off.

If the function fails for any reasion, an error is thrown.

### Get
Find an retrieve a record, in <directory\>  with in <filename\>.
```javascript
get([string <directory\> [,string <filename with wildcards\> [integer <option flags]]]])
```

* Directory name to search. If no directory name is given, get will return at list of collections (Directories) and sequences etc.
* File name to search for. Can be mixed with wildcards '\*' and '?'. If no file name is given, it's the equvivalent of '*'
* Options:
  * RS_ORDER       : Results returned are ordered alphabetically acending.
  * RS_ORDER_DESC  : Results returned are ordered alphabetically decending.

Return an array of
* count   : number of files read
* key     : array of Keys
* record  : array of records

NB: wildcards are very expensive on large datasets, with most filesystems.
(on a regular PC with +10 mill records in the collection, it might take up to a second to retreive one record, where as one might retreive up to 100.000 records with an exact key match)

### Delete
Search for one or more files, whos name match the querry. and delete them.

```javascript
delete([string <directory> [,string <filename with wildcards>]])
```
* Directory name to search. If no directory name is given, **all data are deleted!**
* File name to search for. Can be mixed with wildcards '\*' and '?'. If no file name is given, **all files in a directory are deleted!**

Return an array of
* count : number of files or directories affected

Can also be used to delete a whole collection with its sequences and the entire database.

### Configuring
Configuration options is an array, that can be parsed during require or with the options function
The array can have these options:

#### Set data storage directory and file format to JSON
```javascript
options = [
  "data_storage_area" => "/home/simon/webapp",
  "data_format"       => rs._FORMAT_JSON
];
await rs.options(
  data_storage_area : "/home/simon/webapp",
  data_format       : rs._FORMAT_JSON,
);
```

|index name|values|
|---|---|
|data_storage_area | The directory where the database resides. The default is to use the temporary directory provided by the operating system. If that doesn't work, the DOCUMENT_ROOT directory is used. |
|data_format       | Specify which format the records are stored in. Values are: _FORMAT_NATIVE - default. and RS_FORMAT_JSON - Use JSON data format.|


## Usage
#### Storing records:
```javascript
// Initialize    
const rs = require('./rocket-store');

// POST a record
result = await rs.post("cars", "Mercedes_Benz_GT_R", {owner: "Lisa Simpson"});

// GET a record
result = await rs.get("cars", "*");

console.log(result);
```

The above example will output this:

    {
      count: 1,
      key: [ 'Mercedes_Benz_GT_R' ],
      record: [
        { owner: 'Lisa Simpson' }
      ]
    }


#### Inserting an auto inceremented key
File names must always be unique. If you have more than one instance of a file name, you can add an auto incremented sequence to the name:

```javascript
await rs.post("cars", "BMW_740li", { owner: "Greg Onslow" }, rs._ADD_AUTO_INC);
await rs.post("cars", "BMW_740li", { owner: "Sam Wise"    }, rs._ADD_AUTO_INC);
await rs.post("cars", "BMW_740li", { owner: "Bill Bo"     }, rs._ADD_AUTO_INC);

result = await rs.get("cars", "*");

console.log(result);

```

The above will output this:

    {
      count: 4,
      key: [
       '1-BMW_740li',
       '2-BMW_740li',
       '3-BMW_740li'
      ],
      record: [
        { owner: 'Greg Onslow' },
        { owner: 'Sam Wise' },
        { owner: 'Bill Bo' }
      ]
    }


#### Mass insterts
```javascript
  const dataset = {
      Gregs_BMW_740li           : { owner: "Greg Onslow"  },
      Lisas_Mercedes_Benz_GT_R  : { owner: "Lisa Simpson" },
      Bills_BMW_740li           : { owner: "Bill Bo"      },
  };

  var promises = [];
  var ii = 0;
  for(let i in dataset){
    ii++;
    promises[promises.length] = rs.post("cars", i, dataset[i]);
    if(ii >= 20){
      ii = 0;
      await Promise.all(promises);
    }
  }
  if(promises.length > 0)
    await Promise.all(promises);

  result = await rs.get("cars", "*");

  console.log(result);
```
The above example might output this:

    { count: 3,
      key:[
       'Lisas_Mercedes_Benz_GT_R',
       'Gregs_BMW_740li',
       'Bills_BMW_740li',
      ],
      record: [
        { owner: 'Lisa Simpson' },
        { owner: 'Greg Onslow' },
        { owner: 'Bill Bo' },
      ]
    }


#### Get records with matching keys
```javascript
result = await rs.get("cars", "*BMW*");
```

##### Get list ordered by alphabetically decending keys
```javascript
result = await rs.get("cars", "*BMW*",rs._ORDER_DESC);
```

##### Get list of collections and sequences
```javascript
rs.get();
```
#### Delete matching records from a collection
```javascript
rs.delete("cars", "*BMW*");
```

#### Delete a whole collection
```javascript
rs.delete("cars");
```

#### Delete the entire database
```javascript
rs.delete();
```
---

## Terminology
Rocketstore was made to replace a more complex database, in a setting that required a low footprint and high performance.

Rocketstore is intended to store and retrieve records/documents, organized in collections, using a key.

Compare rocketstore, SQL and file system terms:

| Rocket store | SQL| File system |
|---|---|---
| storage area     |  database     |  data directory root   |
| collection       |  table        |  directory             |
| key              |  key          |  file name             |
| record           |  row          |  file                  |

## File system issue
In this node version (ver 11) a compromise is struck, to compensate for the immaturity of the node file system library; There is no proper glob functionality, that are able to filter a directory search, on a low level. Instead, an array of all entries is read.
This consumes a lot of memory, with a large database. There is no avoiding that, short of improving the node file system library. This is beyond my intentions, at this time. I hope it will be remedied by the node core team.
Instead in this module i have accepted the consumption of memory, but as a compromise, strife to reuse it to improve speed on key searching, by keeping the read keys in memory between searched, in a key_cash.
key_cash has to be maintained in the post and get methods.

A draw back of this is that collection names are restricted to valid variable names as well as directory names.

Another issue is that file locking is yet to be implementet in node.
Therefore a time consuming locking mecahnism is implemented as symlinks.

Both solutions willbe changed, as node matures.

---
## Benchmarks

The test is performed with 1 million records in in a single collection.

|System | Mass insert | exact key search | wildcard search | no hit | delete |
|---|---|---|---|---|---|
|Debian, i7 3rd gen, SSD |69000/sec.|87000/sec.|14,6/sec.|123000/sec.|525/sec.
|Raspbarry Pi Zero |561/sec.|96/sec.|0.27/sec.|147/sec.|10.3/sec.|


---
## Contributions
* Contributions of any kind are highly appreciated.
* Don't hesitate to submit an issue on github. But please provide a reproducible example.
* Code should look good and compact, and be covered by a test case or example.
* Please don't change the formatting style laid out, without a good reason. I know its not the most common standard, but its rather efficient one.
