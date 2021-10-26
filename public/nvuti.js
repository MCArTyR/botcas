let currentHash = "";
let colors = ["#f24e4e","#02be7a"];
let lastBet = undefined;
//WS
const ws = new WebSocket(wsUrl);
ws.onmessage = handleMessage;

function handleMessage(msg) {
    try{msg = JSON.parse(msg.data)}catch{return;}
    console.log(msg);
    if(msg.op >= 101 && msg.op <= 103) parseInfo(msg);
    if(msg.op === 1){
        ws.send(JSON.stringify({op: 1, token, user}));
    }else if(msg.op === 2){
        if(msg.data.nvuti.lastBets) updateLastBets(msg.data.nvuti.lastBets);
        ws.send(JSON.stringify({op: 21}));
    }else if(msg.op === 104){
        if(msg.type && msg.type === 1) return changeBalance(balance + msg.money);
        changeBalance(msg.money);
    }else if(msg.op === 21){
        handleNewGame(msg);
    }else if(msg.op === 25){
        if(msg.type == 2){
            showInfo(0, msg.text);
        }else{
            showResult(msg);
            updCheckInfo(msg.hash.number, msg.hash.salt, msg.hash.hash);
        }
        toggleButtons(false);
    }else if(msg.op === 28) setCheckHash(msg)
    else if(msg.op === 29) addLastBet(msg)
}

function addLastBet(msg){
    let data = {
        username: msg.username,
        number: msg.number,
        need: getNeed(msg.type, msg.percent),
        sum: msg.money,
        chance: msg.percent,
        chanceWidth: Math.max(4, msg.percent),
        win: msg.win ? getWin(msg.money, msg.percent) : false
    };
    let ab = document.getElementById("add-bets");
    let childs = ab.childNodes;
    let num = 10;
    if(ab.childNodes[0] instanceof Text) num++;
    if(childs.length == num){
        childs[num-1].remove();
    }
    document.getElementById("bet-no-info").style.display = "none";
    document.getElementById("bet-title").style.display = "flex";
    // Create elements
    let bet = document.createElement("div");
        bet.classList.add("bet");
        let username = document.createElement("div");
        username.classList.add("bet-username");
        username.innerText = data.username;
        bet.appendChild(username);
        let number = document.createElement("div");
        number.classList.add("bet-number");
        number.innerText = data.number;
        if(data.win) number.style.color = "#02be7a";
        else number.style.color = "#f24e4e";
        bet.appendChild(number);
        let need = document.createElement("div");
        need.classList.add("bet-need");
        need.innerText = data.need;
        bet.appendChild(need);
        let sum = document.createElement("div");
        sum.classList.add("bet-sum");
        sum.appendChild(createCoinIcon());
        let text = document.createElement("div");
        text.innerText = data.sum;
        sum.appendChild(text);
        bet.appendChild(sum);
        //Chance outer
        let chanceOut = document.createElement("div");
        chanceOut.classList.add("chance-out");
        //Chance inner
        let chanceIn = document.createElement("div");
        chanceIn.classList.add("chance-in");
        chanceIn.style.width = "4px";
        if(lastBet) chanceIn.style.width = lastBet.chanceWidth;
        chanceIn.style.backgroundColor = getChanceColor(data.chance);
        if(lastBet) chanceIn.style.backgroundColor = getChanceColor(lastBet.chance);
        chanceOut.appendChild(chanceIn);
        bet.appendChild(chanceOut);
        //Win
        let win = document.createElement("div");
        win.classList.add("bet-win");
        win.appendChild(createCoinIcon());
        let text2 = document.createElement("div");
        if(data.win) text2.innerText = getWin(data.sum, data.chance);
        else text2.innerText = 0;
        if(data.win) text2.style.color = "#02be7a";
        else text2.style.color = "#f24e4e";
        win.appendChild(text2);
        bet.appendChild(win);
     ab.prepend(bet);
     lastBet = {chanceWidth: data.chanceWidth, chance: data.chance}
     //Apply chance animation
    setTimeout(() => {
        chanceIn.style.width = data.chanceWidth+"px";
        chanceIn.style.backgroundColor = getChanceColor(lastBet.chance);
    }, 100);
}

function getChanceColor(chance){
    if(chance < 30) return "#f24e4e";
    else if(chance < 70) return "#f29d4e";
    else return "#02be7a";
}

function createCoinIcon(){
    let icon = document.createElement("div");
    icon.classList.add("money-icon");
    let img = document.createElement("img");
    img.classList.add("money-img");
    img.src = "/money_4.png";
    icon.appendChild(img);
    return icon;
}

function getNeed(type, percent){
    if(type === 0) return "0 - " + ((percent * 10000) - 1);
    else return (1000000 - (percent * 10000)) + " - 999999";
}

function updCheckInfo(number, salt, hash){
    //Clean
    let parent = document.getElementById("hash-data");
    parent.style.justifyContent = "space-between";
    parent.innerHTML = "";
    //Number
    let hashNumber = document.createElement("div");
    hashNumber.classList.add("hash-c");
    let numberFirst = document.createElement("div");
    numberFirst.innerText = "Число игры";
    numberFirst.classList.add("first-content");
    hashNumber.appendChild(numberFirst);
    let numberSecond = document.createElement("div");
    numberSecond.innerText = number;
    numberSecond.classList.add("second-content");
    hashNumber.appendChild(numberSecond);
    parent.appendChild(hashNumber);
    //Salt
    let hashSalt = document.createElement("div");
    hashSalt.classList.add("hash-c");
    let saltFirst = document.createElement("div");
    saltFirst.innerText = "Соль";
    saltFirst.classList.add("first-content");
    hashSalt.appendChild(saltFirst);
    let saltSecond = document.createElement("div");
    saltSecond.classList.add("second-content");
    saltSecond.onclick = copySalt;
        let saltContainer = document.createElement("div");
        saltContainer.id = "salt-container";
            let s = document.createElement("div");
            s.id = "salt-text";
            s.innerText = salt;
        saltContainer.appendChild(s);
        saltContainer.appendChild(createCopyIcon());
        saltSecond.appendChild(saltContainer);
    hashSalt.appendChild(saltSecond);
    parent.appendChild(hashSalt);
    //Hash
    let hashContainer = document.createElement("div");
    hashContainer.onclick = copyHashC;
    hashContainer.id = "hash-container";
    let hh = document.createElement("div");
    hh.id = "hash-text-c";
    hh.innerText = hash;
    hashContainer.appendChild(hh);
    hashContainer.appendChild(createCopyIcon());
    document.getElementById("hash-inner").innerHTML = "";
    document.getElementById("hash-inner").appendChild(hashContainer);
}

function copyHashC(){
    copyFromElement("hash-text-c");
    showInfo(1, "Скопировано");
}

function copySalt(){
    copyFromElement("salt-text");
    showInfo(1, "Скопировано");
}

function createCopyIcon(){
    let copyButton = document.createElement("div");
    copyButton.classList.add("copy-button");
    copyButton.innerHTML = `<svg viewBox="0 0 29 29" class="copy-button-img"><g clip-path="url(#copy_clip0)"><path d="M19.896.453H4.623a2.553 2.553 0 00-2.545 2.545v17.819h2.545V2.998h15.273V.453zm3.818 5.09h-14A2.553 2.553 0 007.17 8.09v17.819c0 1.4 1.145 2.545 2.545 2.545h14c1.4 0 2.546-1.145 2.546-2.546V8.09c0-1.4-1.146-2.545-2.546-2.545zm0 20.364h-14V8.09h14v17.819z"></path></g></svg>`;
    return copyButton;
}

function setCheckHash(msg){
    if(!msg.value) return;
    document.getElementById("hash_input_value").value = msg.value;
}

function checkHash(){
    let toHash = document.getElementById("hash_input_value").value;
    if(toHash.replace(/ +/g, "") == "") return showInfo(0, "Укажите 'Число игры:Соль'");
    if(!(/[0-9]+?:.+?/g).test(toHash)) return showInfo(0, "Укажите 'Число игры:Соль'");
    ws.send(JSON.stringify({op: 28, value: toHash}));
}

function toggleChecker(bool){
    let checkerContainer = document.getElementById("checker-container");
    if(bool){
        checkerContainer.style.display = "flex";
        setTimeout(() => {
            checkerContainer.style.opacity = "1";
        }, 10);
    }else{
        checkerContainer.style.opacity = "0";
        setTimeout(() => {
            checkerContainer.style.display = "none";
        }, 400);
    }

}

function toggleButtons(bool){
    let b = document.getElementsByClassName("sbtn");
    for(let i = 0; i < b.length; i++){
        let button = b[i];
        if(bool) button.setAttribute("disabled", "true");
        else button.removeAttribute("disabled");
    }
}

function showResult(msg){
    let rEl = document.getElementById("result");
    rEl.style.backgroundColor = colors[msg.type];
    rEl.innerText = "Вам выпало : "+msg.hash.number;
    rEl.classList.add("r-active");
}

function handleNewGame(msg){
    setHash(msg.hash);
}

function setHash(hash){
    currentHash = hash;
    document.getElementById("hash-text").innerText = hash;
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
function checkBet(){
    let value = document.getElementById("bet_input").value;
    value = value.replace(/ /g, "");
    let sValue = value;
    value = parseInt(value);
    if(isNaN(value)) document.getElementById("bet_input").value = "";
    else if(BigInt(value) > BigInt("0xFFFFFFFF")){
        document.getElementById("bet_input").value = 0xFFFFFFFF;
    }else document.getElementById("bet_input").value = value;
    updWinMoney();
}
function checkChance(){
    let value = document.getElementById("bet_percent_input").value;
    value = value.replace(/ /g, "");
    if(value == "") document.getElementById("bet_percent_input").value = "";
    else{
        value = parseInt(value);
        if(isNaN(value)) document.getElementById("bet_percent_input").value = "80";
        else if(value < 1) document.getElementById("bet_percent_input").value = "1";
        else if(value > 80) document.getElementById("bet_percent_input").value = "80";
        else document.getElementById("bet_percent_input").value = value;
    }
    updWinMoney();
}
function copyHash(){
    copyFromElement("hash-text");
    showInfo(1, "Скопировано");
}
function copyFromElement(id){
    let range = document.createRange();
    range.selectNode(document.getElementById(id));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
}
function bet(num){
    num = parseInt(num);
    if(isNaN(num)) return;
    if(num < 0 || num > 1) return;
    let money = document.getElementById("bet_input").value;
    money = parseInt(money);
    if(isNaN(money)) return showInfo(0, "Укажите верную сумму ставки");
    if(money < 1) return showInfo(0, "Укажите верную сумму ставки");
    let percent = document.getElementById("bet_percent_input").value;
    percent = parseInt(percent);
    if(isNaN(percent)) return showInfo(0, "Укажите верную сумму ставки");
    if(percent < 1 || percent > 80) return showInfo(0, "Укажите верную сумму ставки");
    ws.send(JSON.stringify({op: 23, percent, money, type: num}));
    toggleButtons(true);
}
function updWinMoney(){
    let percent = document.getElementById("bet_percent_input").value;
    if(percent == "") updateNumber(0, document.getElementById("game-money"))
    else{
        percent = parseInt(percent);
        let min = "0 - " + ((percent * 10000) - 1);
        let max = (1000000 - (percent * 10000)) + " - 999999";
        document.getElementById("smaller").innerText = min;
        document.getElementById("bigger").innerText = max;
        let money = document.getElementById("bet_input").value;
        if(money === 0 || money == "") updateNumber(0, document.getElementById("game-money"));
        else{
            money = parseInt(money);
            updateNumber(getWin(money, percent), document.getElementById("game-money"));
        }
    }
}
function getWin(money, percent){
    return Math.round(money / (0.01 * percent));
}