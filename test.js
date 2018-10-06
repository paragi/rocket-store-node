rs = require('./rocket-store.js');

rs({data_storage_area: "./rs/sdgdf/",data_format: rs._FORMAT_NATIVE});
rs({data_storage_area: "./",data_format: rs._FORMAT_NATIVE});

console.log(rs);
