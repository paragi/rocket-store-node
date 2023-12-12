/*
Author: Simon Riget
Contributor: <Anton Sychev> (anton at sychev dot xyz) 
index.js (c) 2017 - 2023 
Created:  2023-10-28 02:12:56 
Desc: Rocket-store examples as common js
License: 
    * MIT: (c) Paragi 2017, Simon Riget.
*/

//Pre action setup define type: module in your package.json

// Initialize
import * as store from "rocket-store";

const rs = await store.Rocketstore({
	data_storage_area: "./webapp",
	data_format: store._FORMAT_JSON,
});

(async () => {
	// Change storage area from default ( <tempdir>/rsdb )
	console.log("POST a record:\n", await rs.post("cars", "Mercedes_Benz_GT_R", { owner: "Lisa Simpson" }));
	console.log("GET a record:\n", await rs.get("cars", ""));
	console.log("-----");
	console.log("POST 3 records");
	// Post 3 records
	await rs.post("cars", "BMW_740li", { owner: "Greg Onslow" }, rs._ADD_AUTO_INC);
	await rs.post("cars", "BMW_740li", { owner: "Sam Wise" }, rs._ADD_AUTO_INC);
	await rs.post("cars", "BMW_740li", { owner: "Bill Bo" }, rs._ADD_AUTO_INC);
	console.log("Get all records:\n", await rs.get("cars", "*"));
	console.log("-----");
	console.log("Mass instert");
	// Mass instert
	const dataset = {
		Gregs_BMW_740li: { owner: "Greg Onslow" },
		Lisas_Mercedes_Benz_GT_R: { owner: "Lisa Simpson" },
		Bills_BMW_740li: { owner: "Bill Bo" },
	};

	var promises = [];
	var ii = 0;
	for (let i in dataset) {
		ii++;
		promises[promises.length] = rs.post("cars", i, dataset[i]);
		if (ii >= 20) {
			ii = 0;
			await Promise.all(promises);
		}
	}
	if (promises.length > 0) await Promise.all(promises);

	console.log("Get BMW's:\n", await rs.get("cars", "*BMW*"));
	console.log("Get list ordered by alphabetically descending keys:\n", await rs.get("cars", "", rs._ORDER_DESC));

	console.log("Delete all Mercedes's:\n", await rs.delete("cars", "*Mercedes*"));
	console.log("-----");
	console.log("Return all cars");
	console.log(await rs.get("cars", "*"));
	console.log("-----");
	console.log("Delete all records");
	console.log(await rs.delete());
})();

/*
POST a record:
 { key: 'Mercedes_Benz_GT_R', count: 1 }
GET a record:
 {
  count: 1,
  key: [ 'Mercedes_Benz_GT_R' ],
  result: [ { owner: 'Lisa Simpson' } ]
}
-----
POST 3 records
fileLock /Users/too-off/Desktop/a/webapp cars_seq
fileUnlock /Users/too-off/Desktop/a/webapp cars_seq
fileLock /Users/too-off/Desktop/a/webapp cars_seq
fileUnlock /Users/too-off/Desktop/a/webapp cars_seq
fileLock /Users/too-off/Desktop/a/webapp cars_seq
fileUnlock /Users/too-off/Desktop/a/webapp cars_seq
Get all records:
 {
  count: 4,
  key: [ 'Mercedes_Benz_GT_R', '1-BMW_740li', '2-BMW_740li', '3-BMW_740li' ],
  result: [
    { owner: 'Lisa Simpson' },
    { owner: 'Greg Onslow' },
    { owner: 'Sam Wise' },
    { owner: 'Bill Bo' }
  ]
}
-----
Mass instert
Get BMW's:
 {
  count: 5,
  key: [
    '1-BMW_740li',
    '2-BMW_740li',
    '3-BMW_740li',
    'Gregs_BMW_740li',
    'Bills_BMW_740li'
  ],
  result: [
    { owner: 'Greg Onslow' },
    { owner: 'Sam Wise' },
    { owner: 'Bill Bo' },
    { owner: 'Greg Onslow' },
    { owner: 'Bill Bo' }
  ]
}
Get list ordered by alphabetically descending keys:
 {
  count: 7,
  key: [
    'Mercedes_Benz_GT_R',
    'Lisas_Mercedes_Benz_GT_R',
    'Gregs_BMW_740li',
    'Bills_BMW_740li',
    '3-BMW_740li',
    '2-BMW_740li',
    '1-BMW_740li'
  ],
  result: [
    { owner: 'Lisa Simpson' },
    { owner: 'Lisa Simpson' },
    { owner: 'Greg Onslow' },
    { owner: 'Bill Bo' },
    { owner: 'Bill Bo' },
    { owner: 'Sam Wise' },
    { owner: 'Greg Onslow' }
  ]
}
Delete all Mercedes's:
 { count: 2 }
-----
Return all cars
{
  count: 5,
  key: [
    'Gregs_BMW_740li',
    'Bills_BMW_740li',
    '3-BMW_740li',
    '2-BMW_740li',
    '1-BMW_740li'
  ],
  result: [
    { owner: 'Greg Onslow' },
    { owner: 'Bill Bo' },
    { owner: 'Bill Bo' },
    { owner: 'Sam Wise' },
    { owner: 'Greg Onslow' }
  ]
}
-----
Delete all records
{ count: 1 }
*/
