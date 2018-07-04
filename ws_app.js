/**
 * Copyright (c) 2018, OCEAN
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @file
 * @copyright KETI Korea 2018, OCEAN
 * @author Il Yeup Ahn [iyahn@keti.re.kr]
 * Created by ryeubi on 2017-06-07.
 */

var fs = require('fs');
var util = require('util');
var xml2js = require('xml2js');
var url = require('url');
var mqtt = require('mqtt');
var cbor = require('cbor');

var WebSocketClient = require('websocket').client;

var WS_SUBSCRIPTION_ENABLE = 0;
var MQTT_SUBSCRIPTION_ENABLE = 0;

for(var i = 0; i < conf.sub.length; i++) {
    if(conf.sub[i].name != null) {
        if(url.parse(conf.sub[i].nu).protocol === 'ws:') {
            WS_SUBSCRIPTION_ENABLE = 1;
            if(url.parse(conf.sub[i]['nu']).hostname === 'autoset') {
                conf.sub[i]['nu'] = 'ws://' + ip.address() + ':' + conf.ae.port + url.parse(conf.sub[i]['nu']).pathname;
            }
        }
        else if(url.parse(conf.sub[i].nu).protocol === 'mqtt:') {
            MQTT_SUBSCRIPTION_ENABLE = 1;
        }
        else {
            console.log('notification uri of subscription is not supported');
            process.exit();
        }
    }
}

global.sh_adn = require('./ws_adn');
var noti = require('./noti');
var tas = require('./thyme_tas');

function ws_callback(jsonObj) {
    for (var i = 0; i < resp_mqtt_ri_arr.length; i++) {
        if (resp_mqtt_ri_arr[i] == jsonObj['m2m:rsp'].rqi) {
            var socket = socket_q[resp_mqtt_ri_arr[i]];
            var to = resp_mqtt_path_arr[resp_mqtt_ri_arr[i]];
            console.log(to);
            callback_q[resp_mqtt_ri_arr[i]](jsonObj['m2m:rsp'].rsc, jsonObj['m2m:rsp'].pc, to, socket);
            delete callback_q[resp_mqtt_ri_arr[i]];
            delete resp_mqtt_path_arr[resp_mqtt_ri_arr[i]];
            resp_mqtt_ri_arr.splice(i, 1);
            break;
        }
    }
}

function ws_message_handler(message) {
    if(message.type === 'utf8') {
        console.log(message.utf8Data.toString());

        var protocol_arr = this.protocol.split('.');
        var bodytype = protocol_arr[protocol_arr.length-1];

        if(bodytype == 'xml') {
            var parser = new xml2js.Parser({explicitArray: false});
            parser.parseString(message.utf8Data.toString(), function (err, jsonObj) {
                if (err) {
                    console.log('[ws-resp xml2js parser error]');
                }
                else {
                    if (jsonObj['m2m:rsp'] != null) {
                        ws_callback(jsonObj);
                    }
                    else {
                        console.log('[ws-resp] message is not resp');
                        noti.response_ws(ws_connection, 4000, '', conf.ae.id, rqi, '<h1>fail to parsing ws message</h1>');
                    }
                }
            });
        }
        else if(bodytype === 'cbor') {
            var encoded = message.utf8Data.toString();
            cbor.decodeFirst(encoded, function(err, jsonObj) {
                if (err) {
                    console.log('[ws-resp cbor parser error]');
                }
                else {
                    if (jsonObj['m2m:rsp'] == null) {
                        jsonObj['m2m:rsp'] = jsonObj;
                    }

                    ws_callback(jsonObj);
                }
            });
        }
        else { // 'json'
            var jsonObj = JSON.parse(message.utf8Data.toString());

            if (jsonObj['m2m:rsp'] == null) {
                jsonObj['m2m:rsp'] = jsonObj;
            }

            ws_callback(jsonObj);
        }
    }
    else if(message.type === 'binary') {

    }
}

sh_state = 'connect';
var return_count = 0;
var request_count = 0;

function ae_response_action(status, result) {
    var aeid = result['m2m:ae']['aei'];

    console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');

    conf.ae.id = aeid;
}


function create_cnt_all(count, callback) {
    sh_adn.crtct(count, function (rsc) {
        console.log(count + ' - ' + conf.cnt[count].name + ' - x-m2m-rsc : ' + rsc + ' <----');
        if(rsc == 5106 || rsc == 2001 || rsc == 4105) {
            count++;
            if(conf.cnt.length > count) {
                create_cnt_all(count, function (rsc, count) {
                    callback(rsc, count);
                });
            }
            else {
                callback(rsc, count);
            }
        }
        else {
            callback('9999', count);
        }
    });
}

function delete_sub_all(count, callback) {
    sh_adn.delsub(count, function (rsc) {
        console.log(count + ' - ' + conf.sub[count].name + ' - x-m2m-rsc : ' + rsc + ' <----');
        if(rsc == 5106 || rsc == 2002 || rsc == 2000 || rsc == 4105 || rsc == 4004) {
            count++;
            if(conf.sub.length > count) {
                delete_sub_all(count, function (rsc, count) {
                    callback(rsc, count);
                });
            }
            else {
                callback(rsc, count);
            }
        }
        else {
            callback('9999', count);
        }
    });
}

function create_sub_all(count, callback) {
    sh_adn.crtsub(count, function (rsc) {
        console.log(count + ' - ' + conf.sub[count].name + ' - x-m2m-rsc : ' + rsc + ' <----');
        if(rsc == 5106 || rsc == 2001 || rsc == 4105) {
            count++;
            if(conf.sub.length > count) {
                create_sub_all(count, function (rsc, count) {
                    callback(rsc, count);
                })
            }
            else {
                callback(rsc, count);
            }
        }
        else {
            callback('9999', count);
        }
    });
}


function ws_watchdog() {
    if(sh_state == 'connect') {
        ws_connect(conf.cse.host);
    }
    else if(sh_state == 'crtae') {
        console.log('[sh_state] : ' + sh_state);

        sh_adn.crtae(function(status, res_body) {
            if(status == 2001) {
                ae_response_action(status, res_body);
                sh_state = 'crtct';
            }
            else if(status == 5106 || status == 4105) {
                console.log('x-m2m-rsc : ' + status + ' <----');
                sh_state = 'rtvae'
            }
        });
    }
    else if(sh_state == 'rtvae') {
        console.log('[sh_state] : ' + sh_state);
        sh_adn.rtvae(function(status, res_body) {
            if (status == 2000) {
                var aeid = res_body['m2m:ae']['aei'];
                console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');

                if(conf.ae.id != aeid && conf.ae.id != ('/'+aeid)) {
                    console.log('AE-ID created is ' + aeid + ' not equal to device AE-ID is ' + conf.ae.id);
                }
                else {
                    sh_state = 'crtct';
                }
            }
            else {
                console.log('x-m2m-rsc : ' + status + ' <----');
            }
        });
    }
    else if(sh_state == 'crtct') {
        console.log('[sh_state] : ' + sh_state);
        request_count = 0;
        return_count = 0;

        create_cnt_all(0, function(status, count) {
            if(conf.cnt.length <= count) {
                sh_state = 'delsub';
            }
        });
    }
    else if(sh_state == 'delsub') {
        console.log('[sh_state] : ' + sh_state);
        request_count = 0;
        return_count = 0;

        delete_sub_all(0, function(status, count) {
            if(conf.sub.length <= count) {
                sh_state = 'crtsub';
            }
        });
    }

    else if(sh_state == 'crtsub') {
        console.log('[sh_state] : ' + sh_state);
        request_count = 0;
        return_count = 0;

        create_sub_all(0, function(status, count) {
            if(conf.sub.length <= count) {
                sh_state = 'crtci';

                tas.ready();

                ready_for_notification();

                // var _ae = {};
                // _ae.id = conf.ae.id;
                // fs.writeFileSync('aei.json', JSON.stringify(_ae, null, 4), 'utf8');
            }
        });
    }
    else if(sh_state == 'crtci') {

    }
}

var ws_client = null;
global.ws_connection = null;
wdt.set_wdt(require('shortid').generate(), 1, ws_watchdog);

function ws_connect(ws_ip) {
    if(conf.usesecure === 'disable') {
        ws_client = new WebSocketClient();

        if(conf.ae.bodytype === 'xml') {
            var protocol = 'onem2m.r2.0.xml';
        }
        else if(conf.ae.bodytype === 'cbor') {
            protocol = 'onem2m.r2.0.cbor';
        }
        else {
            protocol = 'onem2m.r2.0.json';
        }

        ws_client.connect('ws://'+conf.cse.host+':'+conf.cse.wsport, protocol);

        ws_client.on('connectFailed', function (error) {
            console.log('Connect Error: ' + error.toString());
            ws_client.removeAllListeners();

            sh_state = 'connect';
        });

        ws_client.on('connect', function (connection) {
            console.log('WebSocket Client Connected');
            ws_connection = connection;
            sh_state = 'crtae';

            connection.on('error', function (error) {
                console.log("Connection Error: " + error.toString());
                sh_state = 'connect';
            });
            connection.on('close', function () {
                console.log('echo-protocol Connection Closed');
                sh_state = 'connect';
            });
            connection.on('message', ws_message_handler);
        });
    }
    else {
        console.log('not supported yet');
    }
}

var noti_topic = '';
var _server = null;

function ready_for_notification() {
    if(WS_SUBSCRIPTION_ENABLE == 1) {

        if(_server == null) {
            var http = require('http');
            _server = http.createServer(function (request, response) {
                console.log((new Date()) + ' Received request for ' + request.url);
                response.writeHead(404);
                response.end();
            });

            _server.listen(conf.ae.port, function () {
                console.log((new Date()) + ' Server is listening on port ' + conf.ae.port);
            });

            var WebSocketServer = require('websocket').server;
            var wsServer = new WebSocketServer({
                httpServer: _server,
                // You should not use autoAcceptConnections for production
                // applications, as it defeats all standard cross-origin protection
                // facilities built into the protocol and the browser.  You should
                // *always* verify the connection's origin and decide whether or not
                // to accept it.
                autoAcceptConnections: false
            });

            function originIsAllowed(origin) {
                // put logic here to detect whether the specified origin is allowed.
                return true;
            }

            wsServer.on('request', function (request) {
                if (!originIsAllowed(request.origin)) {
                    // Make sure we only accept requests from an allowed origin
                    request.reject();
                    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                    return;
                }

                for (var index in request.requestedProtocols) {
                    if(request.requestedProtocols.hasOwnProperty(index)) {
                        if(request.requestedProtocols[index] === 'onem2m.r2.0.json') {
                            var connection = request.accept('onem2m.r2.0.json', request.origin);
                            console.log((new Date()) + ' Connection accepted. (json)');
                            connection.on('message', function (message) {
                                if (message.type === 'utf8') {
                                    console.log(message.utf8Data.toString());

                                    var jsonObj = JSON.parse(message.utf8Data.toString());

                                    if (jsonObj['m2m:rqp'] == null) {
                                        jsonObj['m2m:rqp'] = jsonObj;
                                    }
                                    noti.ws_noti_action(connection, 'json', jsonObj);
                                }
                                else if (message.type === 'binary') {
                                }
                            });
                            connection.on('close', function (reasonCode, description) {
                                console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                            });
                            break;
                        }
                        else if(request.requestedProtocols[index] === 'onem2m.r2.0.xml') {
                            connection = request.accept('onem2m.r2.0.xml', request.origin);
                            console.log((new Date()) + ' Connection accepted. (xml)');
                            connection.on('message', function (message) {
                                if (message.type === 'utf8') {
                                    console.log(message.utf8Data.toString());

                                    var parser = new xml2js.Parser({explicitArray: false});
                                    parser.parseString(message.utf8Data.toString(), function (err, jsonObj) {
                                        if (err) {
                                            console.log('[ws noti xml2js parser error]');
                                        }
                                        else {
                                            noti.ws_noti_action(connection, 'xml', jsonObj);
                                        }
                                    });
                                }
                                else if (message.type === 'binary') {
                                }
                            });
                            connection.on('close', function (reasonCode, description) {
                                console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                            });
                            break;
                        }
                    }
                }
            });
        }
    }

    if(MQTT_SUBSCRIPTION_ENABLE == 1) {
        for(var i = 0; i < conf.sub.length; i++) {
            if (conf.sub[i].name != null) {
                if(url.parse(conf.sub[i].nu).protocol === 'mqtt:') {
                    if (url.parse(conf.sub[i]['nu']).hostname === 'autoset') {
                        conf.sub[i]['nu'] = 'mqtt://' + conf.cse.host + '/' + conf.ae.id;
                        noti_topic = util.format('/oneM2M/req/+/%s/#', conf.ae.id);
                    }
                    else if (url.parse(conf.sub[i]['nu']).hostname === conf.cse.host) {
                        noti_topic = util.format('/oneM2M/req/+/%s/#', conf.ae.id);
                    }
                    else {
                        noti_topic = util.format('%s', url.parse(conf.sub[i].nu).pathname);
                    }
                }
            }
        }
        mqtt_connect(conf.cse.host, noti_topic);
    }
}

function mqtt_connect(serverip, noti_topic) {
    if(mqtt_client == null) {
        mqtt_client = mqtt.connect('mqtt://' + serverip + ':' + conf.cse.mqttport);
    }
    mqtt_client.on('connect', function () {
        mqtt_client.subscribe(noti_topic);
        console.log('[mqtt_connect] noti_topic : ' + noti_topic);
    });

    mqtt_client.on('message', function (topic, message) {

        var topic_arr = topic.split("/");

        var bodytype = conf.ae.bodytype;
        if(topic_arr[5] != null) {
            bodytype = (topic_arr[5] === 'xml') ? topic_arr[5] : ((topic_arr[5] === 'json') ? topic_arr[5] : 'json');
        }

        if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'req' && topic_arr[4] === conf.ae.id) {
            console.log(message.toString());
            if(bodytype === 'xml') {
                var parser = new xml2js.Parser({explicitArray: false});
                parser.parseString(message.toString(), function (err, jsonObj) {
                    if (err) {
                        console.log('[mqtt noti xml2js parser error]');
                    }
                    else {
                        noti.mqtt_noti_action(topic_arr, jsonObj);
                    }
                });
            }
            else if(bodytype === 'cbor') {
                var encoded = message.toString();
                cbor.decodeFirst(encoded, function(err, jsonObj) {
                    if (err) {
                        console.log('[mqtt noti cbor parser error]');
                    }
                    else {
                        noti.mqtt_noti_action(topic_arr, jsonObj);
                    }
                });
            }
            else { // json
                var jsonObj = JSON.parse(message.toString());

                if (jsonObj['m2m:rqp'] == null) {
                    jsonObj['m2m:rqp'] = jsonObj;
                }
                noti.mqtt_noti_action(topic_arr, jsonObj);
            }
        }
        else {
            console.log('topic is not supported');
        }
    });
}