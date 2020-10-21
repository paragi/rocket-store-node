# Rocket-Store

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![downloads per month](http://img.shields.io/npm/dm/rocket-store.svg)](https://www.npmjs.org/package/rocket-store)
[![Issues](http://img.shields.io/github/issues/paragi/rocket-store.svg)]( https://github.com/Paragi/rocket-store/issues )
[![GitHub pull-requests](https://img.shields.io/github/issues-pr/paragi/rocket-store.svg)](https://GitHub.com/paragi/rocket-store/pull/)

**Using the filesystem as a searchable database.**

Rocket-Store is a high performance solution to simple data storage and retrieval. It's taking advantage of modern file system's exceptionally advanced cashing mechanisms.

It's packaged in a single file to include, with few dependencies.


## Simple to use:
```javascript
result = await rs.post("cars","Mercedes",{owner:"Lisa Simpson",reg:"N3RD"});

result = await rs.get("cars","*",rs._ORDER_DESC);

result = await rs.delete("cars","*cede*");

```

## Features:
* Extremely fast
* Very reliant
* Very little footprint.
* Very flexible.
* Few dependencies
* Works without configuration or setup.
* Data stored in JSON format
* Configurable
* Also available for PHP
* Has a [session store module for express](https://www.npmjs.com/package/express-session-rsdb)
* Asynchronous mutation safe


## Installation

    npm install rocket-store

## Usages

```js
const rs = require('rocket-store');
```

Rocket-Store does not require initialization:
* The storage area defaults to the OS temp dir.
* When trying to get a non existant collection, the reply is that no records were found.
* When posting to a non existant collection, it is created.

However you can set the storage area and data format to use, with the setOption function, before doing any operation on the data.

## Basic terminology
Rocket-Store was made to replace a more complex database, in a setting that required a low footprint and high performance.

Rocket-Store is intended to store and retrieve records/documents, organized in collections, using a key.

Terms used:
* __Collection__: name of a collections of records. (Like an SQL table)
* __Record__: the data store. (Like an SQL row)
* __Data storage area__: area/directory where collections are stored. (Like SQL data base)
* __Key__: every record has exactly one unique key, which is the same as a file name (same restrictions) and the same wildcards used in searches.

Compare Rocket-Store, SQL and file system terms:

| Rocket-Store | SQL| File system |
|---|---|---
| __storage area__     |  database     |  data directory root   |
| __collection__       |  table        |  directory             |
| __key__              |  key          |  file name             |
| __record__           |  row          |  file                  |

### Post
Stores a record in a collection identified by a unique key

```javascript
post(string <collection>, string <key>, mixed <record> [, integer options])
```
__Collection__ name to contain the records.

__Key__ uniquely identifying the record

No path separators or wildcards etc. are allowed in collection names and keys.
Illigal charakters are silently striped off.

__Options__
  * _ADD_AUTO_INC:  Add an auto incremented sequence to the beginning of the key
  * _ADD_GUID: Add a Globally Unique IDentifier to the key

__Returns__ an associative array containing the result of the operation:
* count : number of records affected (1 on succes)
* key:   string containing the actual key used


If the key already exists, the record will be replaced.

If no key is given, an auto-incremented sequence is used as key.

If the function fails for any reason, an error is thrown.

### Get
Find and retrieve records, in a collection.
```javascript
get([string <collection> [,string <filename with wildcards> [integer <option flags]]]])
```

__Collection__ to search. If no collection name is given, get will return a list of data base assets: collections and sequences etc.

__Key__ to search for. Can be mixed with wildcards '\*' and '?'. An undefined or empty key is the equivalent of '*'

__Options__:
  * _ORDER       : Results returned are ordered alphabetically ascending.
  * _ORDER_DESC  : Results returned are ordered alphabetically descending.
  * _KEYS        : Return keys only (no records)
  * _COUNT       : Return record count only

__Return__ an array of
* count   : number of records affected
* key     : array of keys
* result  : array of records

NB: wildcards are very expensive on large datasets with most filesystems.
(on a regular PC with +10^7 records in the collection, it might take up to a second to retreive one record, whereas one might retrieve up to 100.000 records with an exact key match)

### Delete
Delete one or more records, whos key match.

```javascript
delete([string <collection> [,string <key with wildcards>]])
```

__Collection__ to search. If no collection is given, **THE WHOLE DATA BASE IS DELETED!**

__Key__ to search for. Can be mixed with wildcards '\*' and '?'. If no key is given, **THE ENTIRE COLLECTION INCLUDING SEQUENCES IS DELETED!**

__Return__ an array of
* count : number of records or collections affected


### Configuring
Configuration options is an associative array, that can be parsed during require or with the options function
The array can have these options:

#### Set data storage directory and file format to JSON
```javascript
const rs = require('rocket-store');

await rs.options({
  data_storage_area : "/home/rddb/webapp",
  data_format       : rs._FORMAT_JSON,
});
```

|index name|values|
|---|---|
|data_storage_area | The directory where the database resides. The default is to use a subdirectory to the temporary directory provided by the operating system. If that doesn't work, the DOCUMENT_ROOT directory is used. |
|data_format       | Specify which format the records are stored in. Values are: _FORMAT_NATIVE - default. and RS_FORMAT_JSON - Use JSON data format.|


## Examples
#### Storing records:
```javascript
// Initialize (Not required)   
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
      result: [
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
      result: [
        { owner: 'Greg Onslow' },
        { owner: 'Sam Wise' },
        { owner: 'Bill Bo' }
      ]
    }

#### Inserting with Globally Unique IDentifier key
Another option is to add a GUID to the key.
The GUID is a combination of a timestamp and a random sequence, formatet in accordance to  RFC 4122 (Valid but slightly less random)

If ID's are generated more than 1 millisecond apart, they are 100% unique.
If two ID's are generated at shorter intervals, the likelyhod of collission is up to 1 of 10^15.

```javascript
await rs.post("cars", "BMW_740li", { owner: "Greg Onslow" }, rs._ADD_GUID);
await rs.post("cars", "BMW_740li", { owner: "Sam Wise"    }, rs._ADD_GUID);
await rs.post("cars", "BMW_740li", { owner: "Bill Bo"     }, rs._ADD_GUID);

result = await rs.get("cars", "*");

console.log(result);

```

The above will output this:

    {
      count: 4,
      key: [
       '16b4ffd8-87a0-4000-839f-ea5dd495b000-BMW_740li',
       '16b4ffd8-87b0-4000-8032-45d788fac000-BMW_740li',
       '16b4ffd8-87b0-4000-839f-95bd498f5000-BMW_740li'
      ],
      result: [
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
      result: [
        { owner: 'Lisa Simpson' },
        { owner: 'Greg Onslow' },
        { owner: 'Bill Bo' },
      ]
    }


#### Get records with matching keys
```javascript
result = await rs.get("cars", "*BMW*");
```

##### Get list ordered by alphabetically descending keys
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

## File system issue
This was made with node ver 11. A compromise was struck, to compensate for the immaturity of the node file system library; There is no proper glob functionality, to filter a directory search on a low level. Instead, an array of all entries is read.

This consumes a lot of memory, with a large database. There is no avoiding that, short of improving opon the node file system library. This is beyond my intentions, at this time. I hope it will be remedied by the node core team.

Since the memory will be used anyway, it is applied to improve speed on key searching, by keeping the read keys in memory between searched, as a key_cash.

A draw back of this, is that collection names are restricted to valid variable names, as well as directory names.

Another issue is that file locking is yet to be implementet in node.
Therefore a time consuming locking mecahnism is implemented as symlinks.

Both solutions will hopefully be changed, as node matures.

---
## Benchmarks

Benchmarks are performed with 1 million records in in a single collection.

|System | Mass insert | exact key search | wildcard search | no hit | delete |
|---|---|---|---|---|---|
|Debian, i7 3rd gen, SSD |69000/sec.|87000/sec.|14,6/sec.|123000/sec.|525/sec.
|Raspbarry Pi Zero |561/sec.|96/sec.|0.27/sec.|147/sec.|10.3/sec.|


---
## Contributions
* I appreciate all kinds of contribution.
* Don't hesitate to submit an issue report on [github](https://github.com/paragi/rocket-store/issues). But please provide a reproducible example.
* Code should look good and compact, and be covered by a test case or example.
* Please don't change the formatting style laid out, without a good reason. I know its not the most common standard, but its rather efficient one.


---
## Updates
0.10.8
- removed unneeded module sanitise-filename
0.10.7 
- Bug fix: Wildcard search on windows OS failed to find valid keys.

0.10.6
- Bug fix: Corupted og invalid files now returns an empty record, instead of throwing an error.

0.10.5 repository version correction

0.10.4
- Bug fix: Asynchronous integrity of records failed. Circumvent bug in fs.extra

0.10.3
- Bug fix: Options data_storage_area ignored.

0.10.2
- Data storage directory is now set immediately. An error is thrown later, if creation fails.

0.10.1
- Refactoring of get methods
- Added get flags _COUNT and _KEYS

0.9.4:
- Added Globally Unique IDentifier option to key genration. post flag: _ADD_GUID

0.9.3:
- Cash update dublicate bug fix.

0.9.2:
- Minor fixes and rewrites
