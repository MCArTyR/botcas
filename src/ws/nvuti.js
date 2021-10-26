const config = require("../../config");
const utils = require("../util/utils");
let db;
let wss;

let hashes = {};

module.exports.handle = function(ws, message){
    if(message.op === 21) handleNewGame(ws);
    if(message.op === 23) handleSetBet(ws, message);
    if(message.op === 28) handleGenHash(ws, message);
}

function handleGenHash(ws, message){
    if(!message.value) return ws.send(JSON.stringify({op: 101, text: "Укажите 'Число игры:Соль'"}));
    let toHash = message.value;
    if(toHash.replace(/ +/g, "") == "") return ws.send(JSON.stringify({op: 101, text: "Укажите 'Число игры:Соль'"}));
    if(!(/[0-9]+?:.+?/g).test(toHash)) return ws.send(JSON.stringify({op: 101, text: "Укажите 'Число игры:Соль'"}));
    ws.send(JSON.stringify({op: 28, value: genHash(toHash)}));
}

function checkBet(ws, message, balance){
    let number = hashes[ws.nvutiId].number;
    let win = true;
    if(message.type === 0 && getMin(message.percent) < number) win = false;
    if(message.type === 1 && getMax(message.percent) > number) win = false;
    let money = message.money;
    if(!win) money = 0 - money;
    else money = (getWin(money, message.percent) - money);
    let type = win ? 1 : 0;
    // Update balance
        balance += money;
        db.set(ws.uid, balance);
    //Reply
    wss.massIdSay(ws.uid, JSON.stringify({op: 104, money: balance}));
    ws.send(JSON.stringify({op: 25, hash: hashes[ws.nvutiId], type}));
    // Send new bet
    wss.massSay(JSON.stringify({op: 29, username: ws.user.username, number, percent: message.percent,
                                      type: message.type, money: message.money, win: win}));
    //New game
    delete hashes[ws.nvutiId];
    handleNewGame(ws);
    //TODO: add to lastBets
}

async function handleSetBet(ws, message){
    if(!ws.nvutiId) return ws.terminate();
    if(!hashes[ws.nvutiId]) return ws.terminate();
    if((!message.type && message.type !== 0) || message.type < 0 || message.type > 1){
        ws.send(JSON.stringify({op: 25, type: 2, text: "Неверный тип"}));
        return;
    }
    if(!message.money) return ws.send(JSON.stringify({op: 25, type: 2, text: "Укажите сумму ставки"}));
    if(message.money < 1) return ws.send(JSON.stringify({op: 25, type: 2, text: "Минимальная сумма ставки: 1"}));
    if(parseInt(message.money) != message.money) return ws.send(JSON.stringify({op: 25, type: 2, text: "Сумма ставки должна быть целым числом"}));
    if(!message.percent) return ws.send(JSON.stringify({op: 25, type: 2, text: "Укажите процент"}));
    if(message.percent < 1) return ws.send(JSON.stringify({op: 25, type: 2, text: "Минимальный процент: 1"}));
    if(message.percent > 80) return ws.send(JSON.stringify({op: 25, type: 2, text: "Максимальный процент: 80"}));
    if(parseInt(message.percent) != message.percent) return ws.send(JSON.stringify({op: 25, type: 2, text: "Процент должен быть целым числом"}));
    message.money = parseInt(message.money);
    message.percent = parseInt(message.percent);
    // Balance check
    let user = await db.get(ws.uid);
    if(!user) return ws.send(JSON.stringify({op: 25, type: 2, text: "Пользователь не найден в базе данных! Обновите страницу." }));
    let money = user[config.moneyField];
    if(money < message.money) return ws.send(JSON.stringify({ op: 25, type: 2, text: "Недостаточно средств!"}));
    // Bet
    checkBet(ws, message, money);
}

function getWin(money, percent){
    return Math.round(money / (0.01 * percent));
}

function getMin(percent){
    return ((percent * 10000) - 1);
}
function getMax(percent){
    return (1000000 - (percent * 10000));
}

function handleNewGame(ws){
    if(!ws.nvutiId) ws.nvutiId = utils.genSnowflake();
    let hash = setHash(ws.nvutiId);
    ws.send(JSON.stringify({op: 21, hash}));
}

function setHash(id){
    let number = genNumber();
    let salt = genSalt();
    let hash = genHash(`${number}:${salt}`);
    hashes[id] = {hash, number, salt};
    return hash;
}

function genSalt(){
    return require("crypto").randomBytes(10).toString("base64");
}

function genNumber(){
    return Math.floor(Math.random() * 1000000);
}

function genHash(data){
    return require("crypto").createHash("sha512").update(data).digest("hex");
}

module.exports.usefulData = function(){
    return { };
}

module.exports.init = function(_db, _wss){
    db = _db;
    wss = _wss;
}