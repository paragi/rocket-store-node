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


  Node on i7 3rd gen on SSD
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

  Bench mark test System: i7 3rd gen on SSD
  ┌───────────────────────────────────┬───────────────┐
  │              (index)              │    Values     │
  ├───────────────────────────────────┼───────────────┤
  │            Mass insert            │ '11952 /sec'  │
  │         Exact key search          │ '223714 /sec' │
  │  Exact ramdom key search no hit   │ '58480 /sec'  │
  │ Wildcard ramdom key search 2 hits │  '157 /sec'   │
  │ Wildcard ramdom key search no hit │  '168 /sec'   │
  │   Wildcard ramdom delete 2 hits   │  '153 /sec'   │
  │        Exact random delete        │  '1538 /sec'  │
  └───────────────────────────────────┴───────────────┘

  PHP on Raspbarry PI Zero
  ┌───────────────────────────────────┬─────────────┐
  │ Mass insert                       │    532 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random key search           │    197 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Exact ramdom key search no hit    │   1571 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search 2 hits │   0.11 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search no hit │             │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom delete 2 hits     │   0.11 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random delete               │   181 /sec  │
  └───────────────────────────────────┴─────────────┘

  Node on Raspbarry Pi Zero
  ┌───────────────────────────────────┬─────────────┐
  │ Mass insert                       │    561 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random key search           │     96 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Exact ramdom key search no hit    │    147 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search 2 hits │   0.27 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom key search no hit │   0.27 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Wildcard ramdom delete 2 hits     │   0.29 /sec │
  ├───────────────────────────────────┼─────────────┤
  │ Exact random delete               │   10.3 /sec │
  └───────────────────────────────────┴─────────────┘

\*============================================================================*/

import { rocketstore } from "../dist/mjs/index.js";
import fs from "node:fs";

const rs = await rocketstore({
	data_storage_area: "./webapp",
	data_format: rocketstore._FORMAT_JSON,
});

const data_create = true;
const data_delete = false;
const data_size = 100000;

const record = [
	{
		name: "Adam Smith",
		email: "adam@smith.com",
		id: 1,
	},
	{
		name: "Alice Smith",
		email: "alice@smith.com",
		relatet: [1],
		id: 2,
	},
	{
		name: "Bob Smith",
		email: "bob@smith.com",
		relatet: [1, 2],
		id: 3,
	},
	{
		name: "Dave Canoly",
		email: "dave@canoly.com",
		relatet: [4],
		id: 5,
	},
	{
		name: "Charlie Canoly",
		email: "charlie@canoly.com",
		relatet: [],
		id: 4,
	},
];

const benchmark = [];

console.log("rund?", 1000 / (51023 / 1000));

const sampleStart = (title) => {
	const start = Date.now();
	return start;
};

const sampleStop = (title, start, count) => {
	const end = Date.now();
	if (!count) count = 1;

	const sample_time = (1.0 * count) / ((Number(end) - Number(start)) / 1000);

	if (sample_time < 100) {
		benchmark[title] = `${Math.round(Number(sample_time) * 100) / 100} /sec`;
	} else {
		benchmark[title] = `${Math.round(Number(sample_time))} /sec`;
	}

	if (typeof console.table !== "undefined") {
		let out = {};
		out[title] = benchmark[title];
		console.table(out);
	} else console.log(benchmark[title]);
};

const sampleEnd = () => {
	if (typeof console.table !== "undefined") console.table(benchmark);
	else console.log(benchmark);
};

(async () => {
	try {
		let start = Date.now();
		let test_name; // Declarar test_name aquí
		let stack1 = [];
		let stack2 = [];
		const collection = "person";

		console.log("Collection dir:", rs.data_storage_area + collection);
		console.log("Bench mark test System: i7 3rd gen on SSD");

		/*===========================================================================*/

		if (data_create) {
			test_name = "Mass insert";

			// Eliminar directorio de almacenamiento si existe
			fs.rmSync(rs.data_storage_area, { recursive: true, force: true });

			start = sampleStart(test_name);
			console.log(`Creating ${data_size} test files. Please wait`);

			for (let i = 0; i < data_size / 10; i++) {
				for (let ii = 0; ii < 20; ii++, i++)
					for (let r in record)
						stack1[stack1.length] = rs.post(collection, `${i}-${record[r]["id"]}-${record[r]["name"]}`, record[r]);
				if (stack2.length > 0) await Promise.all(stack2);
				stack2 = [];
				for (let ii = 0; ii < 20; ii++, i++)
					for (let r in record)
						stack2[stack2.length] = rs.post(collection, `${i}-${record[r]["id"]}-${record[r]["name"]}`, record[r]);
				if (stack1.length > 0) await Promise.all(stack1);
				stack1 = [];
			}

			sampleStop(test_name, start, data_size);
		}

		/*===========================================================================*/

		test_name = "Exact key search";
		start = sampleStart(test_name);

		for (let i = 0; i < data_size / 10; i++) {
			for (let ii = 0; ii < 20; ii++, i++) stack1[stack1.length] = rs.get(collection, `${i}-1-Adam Smith`);
			if (stack2.length > 0) await Promise.all(stack2);
			stack2 = [];
			for (let ii = 0; ii < 20; ii++, i++) stack1[stack1.length] = rs.get(collection, `${i}-1-Adam Smith`);
			if (stack1.length > 0) console.log(await Promise.all(stack1));
			stack1 = [];
		}

		sampleStop(test_name, start, data_size);

		/*===========================================================================*/

		test_name = "Exact ramdom key search no hit";
		start = sampleStart(test_name);

		for (let i = 0; i < data_size / 10; i++) {
			for (let ii = 0; ii < 20; ii++, i++) stack1[stack1.length] = rs.get(collection, `${i}-1-Adam SmithX`);
			if (stack2.length > 0) await Promise.all(stack2);
			stack2 = [];
			for (let ii = 0; ii < 20; ii++, i++) stack1[stack1.length] = rs.get(collection, `${i}-1-Adam SmithX`);
			if (stack1.length > 0) await Promise.all(stack1);
			stack1 = [];
		}
		sampleStop(test_name, start, data_size / 10);

		/*===========================================================================*/

		// Fill cash
		await rs.get(collection, `2-?-*Canoly`);

		test_name = "Wildcard ramdom key search 2 hits";

		start = sampleStart(test_name);

		for (let i = 0; i < 40; i++) {
			for (let ii = 0; ii < 20; ii++, i++)
				stack1[stack1.length] = rs.get(collection, `${Math.floor(Math.random() * data_size)}-?-*Canoly`);
			if (stack2.length > 0) await Promise.all(stack2);
			stack2 = [];

			for (let ii = 0; ii < 20; ii++, i++)
				stack2[stack2.length] = rs.get(collection, `${Math.floor(Math.random() * data_size)}-?-*Canoly`);
			if (stack1.length > 0) await Promise.all(stack1);
			stack1 = [];
		}

		sampleStop(test_name, start, 41);

		/*===========================================================================*/

		test_name = "Wildcard ramdom key search no hit";
		start = sampleStart(test_name);

		for (let i = 0; i < 40; i++) {
			for (let ii = 0; ii < 20; ii++, i++)
				stack1[stack1.length] = rs.get(collection, `${Math.floor(Math.random() * data_size)}-?-*Spanoly`);

			if (stack2.length > 0) await Promise.all(stack2);
			stack2 = [];

			for (let ii = 0; ii < 20; ii++, i++)
				stack2[stack2.length] = rs.get(collection, `${Math.floor(Math.random() * data_size)}-?-*Spanoly`);
			if (stack1.length > 0) await Promise.all(stack1);
			stack1 = [];
		}

		sampleStop(test_name, start, 40);

		/*===========================================================================*/

		test_name = "Wildcard ramdom delete 2 hits";
		start = sampleStart(test_name);

		for (let i = 0; i < 100; i++) {
			for (let ii = 0; ii < 20; ii++, i++)
				stack1[stack1.length] = rs.delete(collection, `${Math.floor(Math.random() * data_size)}-?-*Canoly`);

			if (stack2.length > 0) await Promise.all(stack2);
			stack2 = [];

			for (let ii = 0; ii < 20; ii++, i++)
				stack2[stack2.length] = rs.delete(collection, `${Math.floor(Math.random() * data_size)}-?-*Canoly`);
			if (stack1.length > 0) await Promise.all(stack1);
			stack1 = [];
		}

		sampleStop(test_name, start, 100);

		/*===========================================================================*/

		test_name = "Exact random delete";
		start = sampleStart(test_name);

		for (let i = 0; i < 100; i++) {
			for (let ii = 0; ii < 5; ii++, i++)
				stack1[stack1.length] = rs.delete(collection, `${Math.floor(Math.random() * data_size)}-3-Bob Smith`);

			if (stack2.length > 0) await Promise.all(stack2);
			stack2 = [];

			for (let ii = 0; ii < 5; ii++, i++)
				stack2[stack2.length] = rs.delete(collection, `${Math.floor(Math.random() * data_size)}-3-Bob Smith`);
			if (stack1.length > 0) await Promise.all(stack1);
			stack1 = [];
		}

		sampleStop(test_name, start, 100);

		/*===========================================================================*/

		sampleEnd();

		console.time("Mass delete:");
		console.log("Deleting test data if any");
		// Eliminar directorio de almacenamiento si existe
		fs.rmSync(rs.data_storage_area, { recursive: true, force: true });
		console.timeEnd("Mass delete:");
	} catch (err) {
		console.error("some err:", err);
	}
})();
