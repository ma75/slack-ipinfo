'use strict';
var express = require('express'),
    bodyParser = require('body-parser'),
    slack = require('slack-api'),
    app = express(),
    port = process.env.PORT || 3000,
    server = app.listen(port),
    logger = require('./logger');

const TOKEN = process.env.TOKEN;
const WEBHOOK = process.env.WEBHOOK;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/static'));

function isValidToken(payload) {
    return payload.token === TOKEN;
}

app.get('/oauth', function (req, res) {
    logger.debug('oauth', {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.query.code});
    if (!req.query.code) {
        res.status(400).send('Code query param not found!');
    }

    slack.oauth.access({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.query.code
    }, function (err, data) {
        if (err) {
            logger.error('error', err);
        }
        logger.debug('data', data);
    });
});

app.post('/slash', function (req, res) {
    logger.debug('slash received', req.body);
    res.end();
});

app.post('/', function (req, res) {
    let payload = req.body,
        IPInfo = new (require('./IPInfo.js'));

    if (!isValidToken(payload)) {
        return res.status(403).send({error: "Slack slash command token does not match"});
    }

    if (WEBHOOK) {
        IPInfo.sendPrettyResponse(res, payload);
    } else {
        IPInfo.sendPlainTextResponse(res, payload);
    }
});