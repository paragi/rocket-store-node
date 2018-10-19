rs = require('./rocket-store.js');


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
        }, 500)
    });
    toben.c = toben.a + toben.b + toben.c + n;
    console.table([toben.a, toben.b, toben.c,]);
}

treben = async (v) => {
    await toben.sum(v);
    console.table("treben",[toben.a, toben.b, toben.c,]);
}

toben();
treben(4);
treben(5);
