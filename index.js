const database = require("./src/database/index");
const web = require("./src/web/index");
const ws = require("./src/ws/index");
(async() => {
    let db = await database();
    web.init(db);
    ws.init(db);
})()