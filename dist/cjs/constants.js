"use strict";
/*
Author: Simon Riget
Contributor: <Anton Sychev> (anton at sychev dot xyz)
index.js (c) 2017 - 2023
Created:  2023-10-28 02:12:56
Desc: Constants variables
License:
    * MIT: (c) Paragi 2017, Simon Riget.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports._FORMAT_PHP = exports._FORMAT_XML = exports._FORMAT_NATIVE = exports._FORMAT_JSON = exports._ADD_GUID = exports._ADD_AUTO_INC = exports._COUNT = exports._KEYS = exports._DELETE = exports._LOCK = exports._ORDERBY_TIME = exports._ORDER_DESC = exports._ORDER = void 0;
// Get options
exports._ORDER = 0x01;
exports._ORDER_DESC = 0x02;
exports._ORDERBY_TIME = 0x04;
exports._LOCK = 0x08;
exports._DELETE = 0x10;
exports._KEYS = 0x20;
exports._COUNT = 0x40;
// Post options
exports._ADD_AUTO_INC = 0x01;
exports._ADD_GUID = 0x02;
// Data storage format options
exports._FORMAT_JSON = 0x01;
exports._FORMAT_NATIVE = 0x02;
exports._FORMAT_XML = 0x04;
exports._FORMAT_PHP = 0x08;
