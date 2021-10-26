let circleCenter = 225;
let circleRadius = 190;
let curLines = [];
let rotateState = 0;
let circleTime = 0;
let displayTime = false;
let svg = document.getElementById("circle");
initCircle();

//WS
const ws = new WebSocket(wsUrl);
ws.onmessage = handleMessage;

function handleMessage(msg){
    try{msg = JSON.parse(msg.data)}catch{return;}
    console.log(msg);
    if(msg.op >= 101 && msg.op <= 103) parseInfo(msg);
    if(msg.op === 1){
        ws.send(JSON.stringify({op: 1, token, user}));
    }else if(msg.op === 2) {
        //UsefulData
        if(msg.data.jackpot.bets) updateBets(msg.data.jackpot.bets, true);
        updateTime(msg.data.jackpot.time);
    }else if(msg.op === 104){
        if(msg.type && msg.type === 1) return changeBalance(balance + msg.money);
        changeBalance(msg.money);
    }else if(msg.op === 32){
        showInfo(msg.type, msg.text);
        toggleButtons(false);
    }else if(msg.op === 33){
        updateBets(msg.bets);
    }else if(msg.op === 34){
        updateTime(msg.time);
    }else if(msg.op === 35){
        rotateTo(msg.winner.randomValue * 3.6, msg.winner.color);
    }else if(msg.op === 36){
        let text = "Вы выиграли монет: "+msg.money;
        if(msg.type === 0) text = "Вы проиграли монет: "+msg.money;
        showInfo(msg.type, text);
    }
}

function setBet(){
    let value = document.getElementById("bet_input").value;
    if(value.replace(/ /g, '') == "") return showInfo(0, "Укажите ставку");
    let num = parseInt(value);
    if(isNaN(num)) return showInfo(0, "Укажите верное число для ставки");
    if(BigInt(num) > BigInt("0xFFFFFFFF")) return showInfo(0, "Укажите верное число для ставки");
    toggleButtons(true);
    ws.send(JSON.stringify({ op: 31, money: num }));
}
setInterval(() => {
    let i = circleTime - Date.now();
    if(displayTime){
        i -= i % 100;
        setTime(i);
    }else{
        setTime(-5);
    }
}, 100);

function setTime(time){
    if(time === -5) return document.getElementById("timer_value").innerText = "Ожидание";
    if(time < 0) time = 0;
    time = (time / 1000).toFixed(1);
    document.getElementById("timer_value").innerText = time;
}

function updateTime(time){
    if(time === 0){
        circleTime = 0;
        displayTime = false;
    }else{
        circleTime = time + 15000;
        displayTime = true;
    }
}

function toggleButtons(bool){
    let b = document.getElementById("set-bet");
        if(bool) b.setAttribute("disabled", true);
        else b.removeAttribute("disabled");
}

function updateBets(bets, bool = false){
    curLines = Object.keys(bets).map(e => bets[e]);
    let all = curLines.reduce((a,b) => a + b.money, 0);
    if(!bool) updateNumber(all, document.getElementById("game-summ"));
    else document.getElementById("game-summ").innerText = all;
    if(curLines.length === 0){
        initCircle();
        setArrowColor("#dbdbd6");
    }
    else drawCircles();
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
function checkBet() {
    let value = document.getElementById("bet_input").value;
    value = value.replace(/ /g, "");
    let sValue = value;
    value = parseInt(value);
    if (isNaN(value)) return document.getElementById("bet_input").value = "";
    if (BigInt(value) > BigInt("0xFFFFFFFF")) {
        document.getElementById("bet_input").value = 0xFFFFFFFF;
        return;
    }
    document.getElementById("bet_input").value = value;
}
// CIRCLE
function initCircle(){
    svg.innerHTML = "";
    svg.style.transition = `none`;
    svg.style.transform = `rotate(0deg)`;
    setTimeout(() => svg.style.transition = `transform 5s ease`, 10);
    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute("cx", circleCenter);
    circle.setAttribute("cy", circleCenter);
    circle.setAttribute("r", circleRadius);
    circle.setAttribute("stroke-dasharray", 2 * Math.PI * circleRadius);
    circle.setAttribute("stroke-dashoffset", "0");
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("stroke", "rgb(219, 219, 214)");
    circle.setAttribute("stroke-width", "4");
    svg.appendChild(circle);
}

function setArrowColor(color){
    document.getElementById("arrow").style.borderColor = `transparent transparent ${color} transparent`;
}

function rotateTo(rotateNum, color){
    let rotate = rotateNum;
    if(rotateState == 0){
        rotate += 360 * 8;
        rotateState = 1;
    }else rotateState = 0;
    svg.style.transform = `rotate(-${rotate}deg)`;
    setTimeout(() => {
        setArrowColor(color);
    }, 5000);
}

function drawCircles(){
    svg.innerHTML = "";
    parseLines().forEach((line, index) => {
        let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute("cx", circleCenter);
        circle.setAttribute("cy", circleCenter);
        circle.setAttribute("r", circleRadius);
        circle.setAttribute("stroke-dasharray", 2 * Math.PI * circleRadius);
        circle.setAttribute("stroke-dashoffset", (2 * Math.PI * circleRadius) - (2 * Math.PI * circleRadius * (line.percent/100)));
        circle.setAttribute("fill", "transparent");
        circle.setAttribute("stroke", line.color);
        circle.setAttribute("stroke-width", "4");
        circle.setAttribute("transform", `rotate(${-90 + line.rotate}, ${circleCenter}, ${circleCenter})`);
        circle.style.filter = `drop-shadow(0 0 15px ${line.color})`;
        svg.appendChild(circle);
    });
}

function parseLines(){
    let nextRotate = 0;
    let r = curLines.map((line, index) => {
        //Percent
        line.percent = getPercent(index);
        if(line.percent < 100 && line.percent >= 2) line.percent--;
        //Rotate
        line.rotate = nextRotate;
        nextRotate += (line.percent + 1) * 3.6;
        return line;
    });
    return r;
}
function getPercent(index){
    let all = curLines.reduce((a,b) => a + b.money, 0);
    let result = [];
    curLines.forEach(line => {
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