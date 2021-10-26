let colors = ["#474545", "#f29d4e", "#f24e4e", "#02be7a"];
let circleCenter = 190;
let circleRadius = 175;
let rotateState = 0;
let queue = [];
let rollTime = 0;
let displayTime = true;
let colorNames = ["black", "yellow", "red", "green"];
let maxBetLength = 10;
let curBets = [];
let toggled = false;
initBetLength();
initCircle();

//WS
const ws = new WebSocket(wsUrl);
ws.onmessage = handleMessage;

function handleMessage(msg){
    try{msg = JSON.parse(msg.data)}catch{return;}
    if(msg.op >= 101 && msg.op <= 103) parseInfo(msg);
    if(msg.op === 1){
        ws.send(JSON.stringify({op: 1, token, user}));
    }else if(msg.op === 2){
        if(msg.data.double.state == "roll"){
            displayTime = true;
            rollTime = msg.data.double.startTime + 20000;
        }else if(msg.data.double.state == "idle"){
            rollTime = msg.data.double.startTime + 20000;
            displayTime = true;
        }
        if(msg.data.double.queue && msg.data.double.queue[0]){
            queue = msg.data.double.queue;
            updateQueue();
        }
        ws.send(JSON.stringify({op: 19}));
    }else if(msg.op === 12){
        roll(msg);
    }else if(msg.op === 104){
        if(msg.type && msg.type === 1) return changeBalance(balance + msg.money);
        changeBalance(msg.money);
    }else if(msg.op === 17){
        showInfo(msg.type, msg.text);
        toggleButtons(false);
    }else if(msg.op === 18){
        let text = "Вы выиграли монет: "+msg.money;
        if(msg.type === 0) text = "Вы проиграли монет: "+msg.money;
        showInfo(msg.type, text);
    }else if(msg.op === 13){
        curBets = msg.bets;
        updateBets(msg.bets);
    }
}
//
function toggleButtons(bool){
    toggled = bool;
    let b = document.getElementsByClassName("bet-button");
    for(let i = 0; i < b.length; i++){
        let button = b[i];
        if(bool) button.setAttribute("disabled", true);
        else button.removeAttribute("disabled");
    }
}
function initBetLength(){
    let m = window.matchMedia("(max-width: 1200px)");
    if(m.matches) maxBetLength = 5;
    else maxBetLength = 10;
    updateBets(curBets)
    m.addEventListener("change", (e) => {
        if(e.matches) maxBetLength = 5;
        else maxBetLength = 10;
        updateBets(curBets)
    })
}
function cBet(colorID){
    if(toggled) return;
    bet(colorID);
}

function bet(colorID){
    let value = document.getElementById("bet_input").value;
    if(value.replace(/ /g, '') == "") return showInfo(0, "Укажите ставку");
    let num = parseInt(value);
    if(isNaN(num)) return showInfo(0, "Укажите верное число для ставки");
    if(BigInt(num) > BigInt("0xFFFFFFFF")) return showInfo(0, "Укажите верное число для ставки");
    toggleButtons(true);
    ws.send(JSON.stringify({ op: 16, money: num, color: colorID }));
}
//
function roll(msg, time = 5){
    rotateTo(msg.number);
    displayTime = false;
    setTime(0);
    setTimeout(() => {
        rollTime += 20000;
        displayTime = true;
        setQueue(msg.number);
        updateQueue();
        setArrowColor(msg.number);
    }, 5000);
}
function setQueue(num){
    queue.unshift(num);
    if(queue.length > 25) queue = queue.slice(0, 25);
}
//Timer
setInterval(() => {
    if(!displayTime) return;
    let time = rollTime - Date.now();
    time -= time % 100;
    setTime(time);
}, 100);

function setTime(time){
    if(time < 0) time = 0;
    time = (time / 1000).toFixed(1);
    document.getElementById("timer_value").innerText = time;
}

function buttonHalf(){
    let a = document.getElementById("bet_input");
    let cur = parseInt(a.value);
    if(isNaN(cur)) return a.value = "";
    a.value = Math.round(cur / 2);
    checkBet();
}
function buttonX2(){
    let a = document.getElementById("bet_input");
    let cur = parseInt(a.value);
    if(isNaN(cur)) return a.value = "";
    a.value = cur * 2;
    checkBet();
}

function numRemove(){
    document.getElementById("bet_input").value = "";
}
function numAdd(n){
    let a = document.getElementById("bet_input");
    let cur = parseInt(a.value);
    if(isNaN(cur)) return a.value = n;
    a.value = cur + n;
    checkBet();
}
function numFull(){
    document.getElementById("bet_input").value = balance;
    checkBet();
}
//Bets
function updateBets(bets){
    let all = 0;
    // Work with new bets
    bets.forEach((bets2, color) => {
        let cont = document.getElementById("cont-"+colorNames[color]);
        let middle = document.getElementById("middle-"+colorNames[color]);
        let sss = document.getElementById("summ-"+colorNames[color]);
        cont.classList.remove("more-than");
        middle.innerText = "Нет ставок";
        let infor = bets2.info;
        updateNumber(infor.money, sss);
        all += infor.money;
        if(infor.num > maxBetLength){
            cont.classList.add("more-than");
            document.getElementById("bottom-"+colorNames[color]).innerText = "Ещё ставок: "+infor.num;
            bets2.bets = bets2.bets.slice(0, maxBetLength);
        }
        if(bets2.bets.length > 0) middle.innerText = "";
        bets2.bets.forEach(bbb => middle.appendChild(createBetElement(bbb.username, bbb.avatar, bbb.money)));
    });
    updateNumber(all, document.getElementById("game-summ"));
}



function createBetElement(username, avatar, sum){
    let bet = document.createElement("div");
    bet.classList.add("bet");
        let bet_author = document.createElement("div");
        bet_author.classList.add("bet-author");
            let img = document.createElement("img");
            img.src = avatar;
            img.classList.add("bet-avatar");
            bet_author.appendChild(img);
            let u = document.createElement("div");
            u.innerText = username;
            u.classList.add("bet-username");
            bet_author.appendChild(u);
        bet.appendChild(bet_author);
        let bet_s_1 = document.createElement("div");
        bet_s_1.classList.add("bet-s-1");
            let img2 = document.createElement("img");
            img2.src = "/money-middle.png";
            img2.classList.add("bet-s-img");
            bet_s_1.appendChild(img2);
            let bet_s_2 = document.createElement("div");
            bet_s_2.classList.add("bet-s-2");
            bet_s_2.innerText = sum;
            bet_s_1.appendChild(bet_s_2);
        bet.appendChild(bet_s_1);
    return bet;
}
function checkBet(){
    let value = document.getElementById("bet_input").value;
    value = value.replace(/ /g, "");
    let sValue = value;
    value = parseInt(value);
    if(isNaN(value)) return document.getElementById("bet_input").value = "";
    if(BigInt(value) > BigInt("0xFFFFFFFF")){
        document.getElementById("bet_input").value = 0xFFFFFFFF;
        return;
    }
    document.getElementById("bet_input").value = value;
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
//Content
function updateQueue(){
    let qEl = document.getElementById("queue");
    qEl.innerHTML = "";
    queue.forEach(color => {
        let addClass = "black-q";
        color = getColorID(color);
        if(color === 1) addClass = "yellow-q";
        else if(color === 2) addClass = "red-q";
        else if(color === 3) addClass = "green-q";
        let div = document.createElement("div");
        div.classList.add("queue-el");
        div.classList.add(addClass);
        qEl.appendChild(div);
    })
}
// CIRCLE
function initCircle(){
    let j = 1;
    for(let i = 0; i < 360; i += 7.2){
        if(j == 51) return;
        drawCube(getColor(j), i);
        j++;
    }
}

function setArrowColor(num){
    let color = getColor(num);
    document.getElementById("arrow").style.borderColor = `transparent transparent ${color} transparent`;
}

function rotateTo(num){
    let rotate = (num - 1) * 7.2;
    if(rotateState == 0){
        rotate += 1080;
        rotateState = 1;
    }else rotateState = 0;
    let random = Math.random() * 2.8;
    if(Math.random() < 0.5) random = 0 - random;
    rotate += random;
    document.getElementById("circle").style.transform = `rotate(-${rotate}deg)`;
}

function drawCube(color, rotate){
    var x = circleCenter + ((circleRadius) * Math.sin(0));
    var y = circleCenter - ((circleRadius) * Math.cos(0));

    let width = 18;
    let height = 8;

    var cube = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    cube.setAttribute("fill", color);
    cube.setAttribute("stroke", "none");
    cube.setAttribute("width", width);
    cube.setAttribute("height", height);
    cube.setAttribute("x", x - (width / 2));
    cube.setAttribute("y", y - (width / 2));
    cube.setAttribute("rx", "3");
    cube.setAttribute("ry", "3");
    cube.setAttribute("transform", `rotate(${rotate}, ${circleCenter}, ${circleCenter})`);
    document.getElementById("circle").appendChild(cube);
}
