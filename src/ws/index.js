const config = require("../../config");
const w = require("http");
const WebSocket = require("ws");
let db;
const server = w.createServer();
const wss = new WebSocket.WebSocketServer({ server });
let tokens = {};
let double = require("./double");
let nvuti = require("./nvuti");
let jackpot = require("./jackpot");

wss.massSay = massSay;
wss.massIdSay = massIdSay;

wss.on('connection', (ws) => {
   ws.on('message', (msg) => handleMessage(ws, msg));
   ws.send(JSON.stringify({ op: 1 }));
   checkForAuthorization(ws);
});

function handleMessage(ws, message){
    try{message = JSON.parse(message);}catch{ ws.terminate(); return; }
    if(!ws.uid && message.op !== 1) return;
    if(message.op === 1) handleAuthorization(ws, message);
    if(message.op >= 11 && message.op <= 20) double.handle(ws, message);
    if(message.op >= 21 && message.op <= 30) nvuti.handle(ws, message);
    if(message.op >= 31 && message.op <= 40) jackpot.handle(ws, message);
}

function sendUsefulData(ws){
    let usefulData = {
        double: double.usefulData(),
        nvuti: nvuti.usefulData(),
        jackpot: jackpot.usefulData()
    }
    ws.send(JSON.stringify({op: 2, data: usefulData}));
}

function handleAuthorization(ws, message){
    if(!message.token) return ws.terminate();
    if(!tokens[message.token]) return ws.terminate();
    ws.uid = tokens[message.token];
    ws.user = message.user;
    sendUsefulData(ws);
}

function checkForAuthorization(ws){
    setTimeout(() => {
        if(!ws.uid) ws.terminate();
    }, 15000);
}

function massIdSay(id, msg){
    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN){
            if(client.uid == id) client.send(msg);
        }
    })
}

function massSay(msg){
    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN){
            client.send(msg);
        }
    })
}

module.exports.init = function(_db){
    db = _db;
    server.listen(config.ws_port, () => console.log("[WebSocket] Listening port "+config.ws_port));
    double.init(db, wss);
    nvuti.init(db, wss);
    jackpot.init(db, wss);
}

function createToken(id){
    let token;
    let toks = Object.keys(tokens).map(e => tokens[e]);
    if(!toks.includes(id)){
        token = genToken(id);
        tokens[token] = id;
    }else{
        Object.keys(tokens).forEach(tok => {
            if(tokens[tok] == id) token = tok;
        })
    }
    return token;
}

function genToken(id){
    let first = Buffer.from(id).toString('base64');
    let second = require("crypto").randomBytes(2).toString("hex");
    let third = require("crypto").randomBytes(20).toString("hex");
    return first + "." + second + "." + third;
}

module.exports.createToken = createToken;