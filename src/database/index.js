const { MongoClient } = require("mongodb");
const config = require("../../config");

const client = new MongoClient(config.mongodb);

function set(db, id, money){
    return db.db(config.databaseName).collection(config.collectionName).updateOne(
        { [config.idField]: { $eq: id } },
        { $set: { [config.moneyField]: money } }
    );
}
function get(db, id){
    return new Promise(async(res, rej) => {
        let result = await db.db(config.databaseName)
                             .collection(config.collectionName)
                             .findOne({ [config.idField]: { $eq: id } });
        res(result);
    });
}
function getMany(db, ids){
    return new Promise(async(res, rej) => {
        let result = await db.db(config.databaseName)
            .collection(config.collectionName)
            .find({ [config.idField]: { $in: ids } }).toArray();
        res(result);
    });
}
function bulk(db, operations){
    return new Promise(async(res, rej) => {
        let result = await db.db(config.databaseName)
            .collection(config.collectionName)
            .bulkWrite(operations);
        res(result);
    })
}

module.exports = function(){
    return new Promise(async(res, rej) => {
        let r = false;
        await client.connect().catch((e) => {rej(r); r = true});
        if(!r){
            console.log("[DATABASE] Connected")
            res({
                set: (id, money) => set(client, id, money),
                get: (id) => get(client, id),
                getMany: (ids) => getMany(client, ids),
                bulk: (operations) => bulk(client, operations)
            })
        }
    });
}