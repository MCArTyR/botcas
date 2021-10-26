const config = require("../../config");
const WebSocket = require("ws");
let db;
let wss;

let startTime = 0;
let state = "idle";
let bets = {};

module.exports.handle = function(ws, message){
    if(message.op === 31) handleSetBet(ws, message);
}

function sendUpdateBets(){
    wss.massSay(JSON.stringify({ op: 33, bets }));
}

function updateTime(time){
    startTime = time;
    wss.massSay(JSON.stringify({ op: 34, time: startTime }));
}

function roll(){
    //Stop if only one player
    if(Object.keys(bets).length <= 1) return;
    if(startTime === 0){
        updateTime(Date.now());
        setTimeout(() => {
            state = "roll";
            let winner = selectRandom();
            wss.massSay(JSON.stringify({ op: 35, winner }));
            setTimeout(() => {
                state = "idle";
                updateMembers(winner.id);
                updateTime(0);
            }, 8000);
        }, 15000);
    }
}

function updateMembers(id){
    let winMoney = Object.keys(bets).map(e => bets[e]).reduce((a,b) => a + b.money, 0);
    Object.keys(bets).forEach(async uid => {
        let bet = bets[uid];
        let newMoney = 0;
        if(uid === id){
            //Win
            let user = await db.get(uid);
            if(user && (user[config.moneyField] || user[config.moneyField] === 0)){
                let curMoney = user[config.moneyField];
                db.set(uid, curMoney + winMoney);
                wss.massIdSay(uid, JSON.stringify({op: 36, type: 1, money: winMoney}));
                wss.massIdSay(uid, JSON.stringify({op: 104, money: curMoney + winMoney}));
            }
        }else{
            //Lose
            wss.massIdSay(uid, JSON.stringify({op: 36, type: 0, money: bet.money}));
        }
    })
    bets = {};
    sendUpdateBets();
}

async function handleSetBet(ws, message){
    if(state == "roll") return ws.send(JSON.stringify({op: 32, type: 0, text: "Игра уже началась"}));
    if(Object.keys(bets).length >= 10) return ws.send(JSON.stringify({op: 32, type: 0, text: "Может играть не больше 10 игроков"}));
    if(message.money < 10) return ws.send(JSON.stringify({op: 32, type: 0, text: "Минимальная сумма ставки: 10"}));
    if(parseInt(message.money) != message.money) return ws.send(JSON.stringify({op: 32, type: 0, text: "Cумма ставки должна быть целым числом"}));
    message.money = parseInt(message.money);

    let user = await db.get(ws.uid);
    if(!user) return ws.send(JSON.stringify({op: 32, type: 0, text: "Пользователь не найден в базе данных! Обновите страницу." }));
    let money = user[config.moneyField];
    if(!money) money = 0;
    if(money < message.money) return ws.send(JSON.stringify({ op: 32, type: 0, text: "Недостаточно средств!"}));

    money -= message.money;
    db.set(ws.uid, money);

    //Set bet
    if(!bets[ws.uid]) bets[ws.uid] = { money: 0, color: genColor(), user: ws.user };
    bets[ws.uid].money += message.money;

    wss.massIdSay(ws.uid, JSON.stringify({op: 104, money}));
    ws.send(JSON.stringify({op: 32, type: 1, text: "Ставка сделана"}));
    sendUpdateBets();
    //Try for roll
    roll();
}

function genColor(){
    let symbols = "1234567890abcdef".split("");
    let color = "#";
    for(let i = 0; i < 6; i++){
        color += symbols[Math.floor(Math.random() * symbols.length)];
    }
    color = color.replace(/[1-6]/g, (match) => symbols[symbols.indexOf(match)+6]);
    if(Object.keys(bets).map(e => bets[e].color).includes(color)) return genColor();
    return color;
}

function selectRandom(){
    let random = Math.floor(Math.random() * 101);
    let winner = false;
    let min = 0;
    if(random === 0) winner = parseBets()[0];
    else parseBets().forEach(e => {
        if(random > min && random < (min+e.percent)) winner = e;
        min += e.percent;
    });
    winner.randomValue = random;
    return winner;
}

function genRandom(){
    let values = [];
    let min = 0;
    parseBets().forEach(e => {
        if(e.percent < 100 && e.percent >= 2) e.percent--;
        for(let i = min; i < (e.percent + min); i++){
            values.push(i+1);
        }
        min += e.percent+1;
    });
    return values[Math.floor(Math.random() * values.length)];
}

function parseBets(){
    let bb = Object.keys(bets).map(a => ({ ...bets[a], id: a }));
    let all = bb.reduce((a,b) => a + b.money, 0);
    let nextRotate = 0;
    return bb.map((line, index) => {
        //Percent
        line.percent = getPercent(index);
        return line;
    })
}

function getPercent(index){
    let all = Object.keys(bets).map(a => bets[a]).reduce((a,b) => a + b.money, 0);
    let result = [];
    Object.keys(bets).map(a => bets[a]).forEach(line => {
        result.push(line.money/(all/100));
    });
    result.forEach((r, index) => {
        if(r < 2){
            if(r < 1) result[index] = 1;
            let a = 1 - r;
            let val = result.map(z => z).sort((a,b) => b-a)[0];
            let valIndex = result.indexOf(val);
            if(r < 1) val -= a;
            val -= 1;
            result[valIndex] = val;
        }
    });
    return result[index];
}

module.exports.usefulData = function(){
    return { time: startTime, bets };
}

module.exports.init = function(_db, _wss){
    db = _db;
    wss = _wss;
}