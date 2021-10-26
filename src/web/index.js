const config = require("../../config");
const express = require("express");
const app = express();
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const { createToken } = require("../ws/index");
let db;

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(cookieSession({ name: "session", secret: config.cookieKey, maxAge: (Date.now() + config.maxCookieAge) }));

app.use(express.static("public"));

app.use('/oauth2', require("./oauth2"));

app.get('/jackpot', async (req, res) => {
    if(!req.session.uid) return res.redirect("/oauth2");
    let user = await db.get(req.session.uid);
    if(!user) return res.redirect("/4");
    if(!user[config.moneyField]) user[config.moneyField] = 0;
    let dUser;
    dUser = await getUser(req.session.uid).catch(e => dUser = undefined);
    if(!dUser) dUser = {
        id: req.session.uid
    }
    dUser.avatar = getAvatar(dUser.id, dUser.avatar);
    res.render('jackpot', {
        data: {
            ws: config.wsHost,
            id: req.session.uid,
            wsToken: createToken(req.session.uid),
            balance: user[config.moneyField],
            user: dUser
        }
    })
})

app.get('/double', async (req, res) => {
    if(!req.session.uid) return res.redirect("/oauth2");
    let user = await db.get(req.session.uid);
    if(!user) return res.redirect("/4");
    if(!user[config.moneyField]) user[config.moneyField] = 0;
    let dUser;
    dUser = await getUser(req.session.uid).catch(e => dUser = undefined);
    if(!dUser) dUser = {
        id: req.session.uid
    }
    dUser.avatar = getAvatar(dUser.id, dUser.avatar);
    res.render('double', {
        data: {
            ws: config.wsHost,
            id: req.session.uid,
            wsToken: createToken(req.session.uid),
            balance: user[config.moneyField],
            user: dUser
        }
    })
})

app.get('/nvuti', async (req, res) => {
    if(!req.session.uid) return res.redirect("/oauth2");
    let user = await db.get(req.session.uid);
    if(!user) return res.redirect("/4");
    if(!user[config.moneyField]) user[config.moneyField] = 0;
    let dUser;
    dUser = await getUser(req.session.uid).catch(e => dUser = undefined);
    if(!dUser) dUser = {
        id: req.session.uid
    }
    dUser.avatar = getAvatar(dUser.id, dUser.avatar);
    res.render('nvuti', {
        data: {
            ws: config.wsHost,
            id: req.session.uid,
            wsToken: createToken(req.session.uid),
            balance: user[config.moneyField],
            user: dUser
        }
    })
})

module.exports.init = function(_db){
    db = _db;
    app.listen(config.web_port, () => console.log("[WEB] Listening port "+config.web_port));
}

function getUser(id){
    return new Promise((res, rej) => {
        rp({
            method: "GET",
            url: "https://discord.com/api/v9/users/"+id,
            headers: {
                "Authorization": `Bot ${config.bot_token}`
            },
            json: true
        }).then(user => res(user)).catch(e => rej(undefined));
    })
}

function getAvatar(id, hash){
    if(!hash) return "https://cdn.discordapp.com/embed/avatars/1.png";
    let url = "https://cdn.discordapp.com/avatars/";
    url += id + "/";
    url += hash + ".";
    url += hash.startsWith("a_") ? "gif" : "png";
    url += "?size=512";
    return url;
}