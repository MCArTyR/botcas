const express = require("express");
const config = require("../../config");
const rp = require("request-promise");
const router = express.Router();

router.get('/', async (req, res) => {
    if(!req.query.code) return res.redirect("https://discord.com/api/oauth2/authorize" +
        "?client_id=" + config.application_id +
        "&redirect_uri=" + encodeURIComponent(config.host) + "/oauth2" +
        "&response_type=code" +
        "&scope=identify");
    rp({
        method: 'POST',
        url: "https://discord.com/api/oauth2/token",
        form: {
            client_id: config.application_id,
            client_secret: config.application_secret,
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: config.host+"/oauth2"
        }, json: true
    }).then(result => {
        req.session.auth = result.access_token;
        rp({
            method: "GET",
            url: "https://discord.com/api/v9/users/@me",
            headers: {
                'Authorization': `Bearer ${result.access_token}`
            }, json: true
        }).then(user => {
            req.session.uid = user.id;
            res.redirect("/");
        }).catch(e => console.error("[OAUTH2] Error!"))

    }).catch(e => console.error("[OAUTH2] Error!"));
});

module.exports = router;