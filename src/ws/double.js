const config = require("../../config");
const WebSocket = require("ws");
let db;
let wss;

let state = "idle";
let startTime = 0;
let bets = {};
let queue = [];


module.exports.handle = function(ws, message){
    if(message.op === 16) handleSetBet(ws, message);
    if(message.op === 19) sendUpdateBets(ws.uid);
}
async function handleSetBet(ws, message){
    if(state == "roll") return ws.send(JSON.stringify({op: 17, type: 0, text: "Игра уже началась"}));
    if(message.color < 0 || message.color > 3) return ws.send(JSON.stringify({op: 17, type: 0, text: "Неверный цвет"}));
    if(message.money < 1) return ws.send(JSON.stringify({op: 17, type: 0, text: "Минимальная сумма ставки: 1"}));
    if(parseInt(message.money) != message.money) return ws.send(JSON.stringify({op: 17, type: 0, text: "Cумма ставки должна быть целым числом"}));
    message.money = parseInt(message.money);
        // Balance check
    let user = await db.get(ws.uid);
    if(!user) return ws.send(JSON.stringify({op: 17, type: 0, text: "Пользователь не найден в базе данных! Обновите страницу." }));
    let money = user[config.moneyField];
    if(money < message.money) return ws.send(JSON.stringify({ op: 17, type: 0, text: "Недостаточно средств!"}));
    //Balance update
    money -= message.money;
    db.set(ws.uid, money);
    // Set bet
    if(!bets[ws.uid]) bets[ws.uid] = [];
    bets[ws.uid].push({
        color: message.color,
        money: message.money,
        username: ws.user.username,
        avatar: ws.user.avatar
    });
    //Reply
    wss.massIdSay(ws.uid, JSON.stringify({op: 104, money}));
    ws.send(JSON.stringify({op: 17, type: 1, text: "Ставка сделана"}));
    sendUpdateBets();
}
function fullInit(){
    init();
    setInterval(init, 20000);
}
function init(){
    let num = roll();
    updateQueue(num);
    state = "roll";
    startTime = Date.now();
    setTimeout(() => {
        state = "idle";
        checkBets(getColorID(num));
    }, 5000);
}

function sendUpdateBets(uid = undefined){
    if(!bets) return undefined;
    let newBets = [[],[],[],[]];
    Object.keys(bets).forEach(id => {
        let money = [0, 0, 0, 0];
        bets[id].forEach(bet => {
            let color = bet.color;
            money[color] += bet.money;
        });
        money.forEach((m, i) => {
            if(m < 1) return;
            newBets[i].push({
                uid: id,
                username: bets[id][0].username,
                avatar: bets[id][0].avatar,
                money: m
            })
        })
    });
    wss.clients.forEach(client => {
        if(!client.uid) return;
       if(client.readyState === WebSocket.OPEN){
      if(!!uid && client.uid !== uid) return;
           let sendBets = newBets.map(bets3 => {
               let bets2 = bets3;
                   bets2 = bets2.sort((a,b) => a.money - b.money);
                   bets2 = bets2.sort((a, b) => {
                       if(a.uid == client.uid) return -1;
                       return 0;
                   });
                   let info = {
                       num: bets2.length,
                       money: bets2.reduce((a,b) => a + b.money, 0)
                   }
                   bets2.slice(0, 10 + 1);
                   return {info: info, bets: bets2};
           });
           if(!!uid) wss.massIdSay(uid, JSON.stringify({op: 13, bets: sendBets}));
           else wss.massSay(JSON.stringify({op: 13, bets: sendBets}));
       }
    });
}

async function checkBets(color) {
    let betsForCheck = Object.keys(bets).filter(e => bets[e].length > 0);
    if(betsForCheck.length < 1) return;
    let updates = [];
    let users = await db.getMany(betsForCheck);
    betsForCheck.forEach(uid => {
        let user = users.filter(u => u[config.idField] == uid)[0];
        let userBets = bets[uid];
        let winMoney = 0;
        let loseMoney = 0;
        userBets.forEach(bet => {
            if (bet.color == color) {
                //win
                winMoney += bet.money * getMultiplier(color);
            } else {
                //lose
                loseMoney += bet.money;
            }
        });
        delete bets[uid];
        let newMoney = winMoney;
        if(user && (!!user[config.moneyField] || user[config.moneyField] === 0)){
            wss.massIdSay(uid, JSON.stringify({ op: 104, money: (newMoney + user[config.moneyField]) }));
        }else{
            wss.massIdSay(uid, JSON.stringify({op: 104, type: 1, money: newMoney}));
        }
        if (winMoney !== 0) wss.massIdSay(uid, JSON.stringify({op: 18, type: 1, money: winMoney}));
        if (loseMoney !== 0) wss.massIdSay(uid, JSON.stringify({op: 18, type: 0, money: loseMoney}));
        //Updates
        updates.push({
            updateOne: {
                filter: {[config.idField]: {$eq: uid}},
                update: {$inc: {[config.moneyField]: newMoney}}
            }
        });
    });
    sendUpdateBets();
    if(updates.length > 0) db.bulk(updates);
}

function getMultiplier(color){
    if(color === 0) return 2;
    if(color === 1) return 3;
    if(color === 2) return 5;
    if(color === 3) return 50;
}

function updateQueue(num){
    queue.unshift(num);
    if(queue.length > 25) queue = queue.slice(0, 25);
}

function roll(){
    let num = Math.floor(Math.random() * 50) + 1;
    wss.massSay(JSON.stringify({ op: 12, number: num }));
    return num;
}

function getColor(num){
    return colors[getColorID(num)];
}
function getColorID(num){
    if(num == 50) return 3;
    if(num % 2 == 0) return 0;
    if(num % 3 == 0) return 2;
    return 1;
}

module.exports.usefulData = function(){
    return { state, startTime, bets, queue };
}

module.exports.init = function(_db, _wss){
    db = _db;
    wss = _wss;
    fullInit();
}
