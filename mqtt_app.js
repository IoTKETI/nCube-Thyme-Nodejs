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
 * Created by ryeubi on 2015-11-20.
 */

var fs = require('fs');
var mqtt = require('mqtt');
var util = require('util');
var xml2js = require('xml2js');
var url = require('url');
var cbor = require('cbor');

global.req_topic = '/oneM2M/req/'+conf.ae.id+conf.cse.id+'/'+conf.ae.bodytype;

var reg_resp_topic = '/oneM2M/reg_resp/'+conf.ae.id+'/+/#';
var resp_topic = '/oneM2M/resp/'+conf.ae.id+'/+/#';
var noti_topic = '/oneM2M/req/+/'+conf.ae.id+'/#';

global.sh_adn = require('./mqtt_adn');
var noti = require('./noti');
var tas = require('./thyme_tas');

if (conf.usesecure === 'disable') {
    var connectOptions = {
        host: conf.cse.host,
        port: conf.cse.mqttport,
//              username: 'keti',
//              password: 'keti123',
        protocol: "mqtt",
        keepalive: 10,
//              clientId: serverUID,
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 2000,
        rejectUnauthorized: false
    };
}
else {
    connectOptions = {
        host: brokerip,
        port: conf.cse.mqttport,
        protocol: "mqtts",
        keepalive: 10,
//              clientId: serverUID,
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 2000,
        key: fs.readFileSync("./server-key.pem"),
        cert: fs.readFileSync("./server-crt.pem"),
        rejectUnauthorized: false
    };
}

mqtt_client = mqtt.connect(connectOptions);

mqtt_client.on('connect', function () {
    mqtt_client.subscribe(reg_resp_topic);
    mqtt_client.subscribe(resp_topic);
    mqtt_client.subscribe(noti_topic);

    console.log('subscribe reg_resp_topic as ' + reg_resp_topic);
    console.log('subscribe resp_topic as ' + resp_topic);
    console.log('subscribe noti_topic as ' + noti_topic);

    sh_state = 'crtae';
});

mqtt_client.on('message', mqtt_message_handler);

function mqtt_callback(jsonObj) {
    for (var i = 0; i < resp_mqtt_ri_arr.length; i++) {
        if (resp_mqtt_ri_arr[i] == jsonObj['m2m:rsp'].rqi) {
            console.log(resp_mqtt_path_arr[resp_mqtt_ri_arr[i]]);
            callback_q[resp_mqtt_ri_arr[i]](jsonObj['m2m:rsp'].rsc, jsonObj['m2m:rsp'].pc);
            delete callback_q[resp_mqtt_ri_arr[i]];
            delete resp_mqtt_path_arr[resp_mqtt_ri_arr[i]];
            resp_mqtt_ri_arr.splice(i, 1);
            --i;
            break;
        }
    }
}

function mqtt_message_handler(topic, message) {
    var topic_arr = topic.split("/");
    var bodytype = conf.ae.bodytype;
    if(topic_arr[5] != null) {
        bodytype = (topic_arr[5] === 'xml') ? topic_arr[5] : ((topic_arr[5] === 'json') ? topic_arr[5] : ((topic_arr[5] === 'cbor') ? topic_arr[5] : 'json'));
    }

    console.log(message.toString());

    if(topic_arr[1] == 'oneM2M' && (topic_arr[2] == 'resp' || topic_arr[2] == 'reg_resp') && topic_arr[3].replace(':', '/') == conf.ae.id) {
        if(bodytype === 'xml') {
            var parser = new xml2js.Parser({explicitArray: false});
            parser.parseString(message.toString(), function (err, jsonObj) {
                if (err) {
                    console.log('[mqtt-resp xml2js parser error]');
                }
                else {
                    if (jsonObj['m2m:rsp'] != null) {
                        mqtt_callback(jsonObj);
                    }
                    else {
                        NOPRINT==='true'?NOPRINT='true':console.log('[pxymqtt-resp] message is not resp');
                        noti.response_mqtt(topic_arr[4], 4000, '', conf.ae.id, rqi, '<h1>fail to parsing mqtt message</h1>');
                    }
                }
            });
        }
        else if(bodytype === 'cbor') {
            var encoded = message.toString();
            cbor.decodeFirst(encoded, function(err, jsonObj) {
                if (err) {
                    console.log('[mqtt-resp cbor parser error]');
                }
                else {
                    if (jsonObj['m2m:rsp'] == null) {
                        jsonObj['m2m:rsp'] = jsonObj;
                    }

                    mqtt_callback(jsonObj);
                }
            });
        }
        else { // 'json'
            var jsonObj = JSON.parse(message.toString());

            if (jsonObj['m2m:rsp'] == null) {
                jsonObj['m2m:rsp'] = jsonObj;
            }

            mqtt_callback(jsonObj);
        }
    }
    else if(topic_arr[1] == 'oneM2M' && topic_arr[2] == 'req' && topic_arr[4] == conf.ae.id) {
        if(bodytype == 'xml') {
            parser = new xml2js.Parser({explicitArray: false});
            parser.parseString(message.toString(), function (err, jsonObj) {
                if (err) {
                    console.log('[mqtt noti xml2js parser error]');
                }
                else {
                    if(jsonObj['m2m:rqp'].op == '5' || jsonObj['m2m:rqp'].op == 5) {
                        noti.mqtt_noti_action(topic_arr, jsonObj);
                    }
                }
            });
        }
        else if(bodytype === 'cbor') {
            encoded = message.toString();
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
            jsonObj = JSON.parse(message.toString());

            if (jsonObj['m2m:rqp'] == null) {
                jsonObj['m2m:rqp'] = jsonObj;
            }

            noti.mqtt_noti_action(topic_arr, jsonObj);
        }
    }
    else {
        console.log('topic is not supported');
    }
}

sh_state = 'connect';
var return_count = 0;
var request_count = 0;

function ae_response_action(status, result) {
    var aeid = result['m2m:ae']['aei'];

    console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');

    mqtt_client.unsubscribe(reg_resp_topic);
    mqtt_client.unsubscribe(resp_topic);
    mqtt_client.unsubscribe(noti_topic);

    conf.ae.id = aeid;

    //fs.writeFileSync('aei.json', JSON.stringify(conf.ae.id, null, 4), 'utf8');

    reg_resp_topic = '/oneM2M/reg_resp/'+conf.ae.id+'/+/#';
    req_topic = '/oneM2M/req/'+conf.ae.id+conf.cse.id+'/'+conf.ae.bodytype;
    resp_topic = '/oneM2M/resp/'+conf.ae.id+'/+/#';
    noti_topic = '/oneM2M/req'+conf.cse.id+'/'+conf.ae.id+'/#';

    mqtt_client.subscribe(reg_resp_topic);
    mqtt_client.subscribe(resp_topic);
    mqtt_client.subscribe(noti_topic);
}

function create_cnt_all(count, callback) {
    if(conf.cnt.length == 0) {
        callback(2001, count);
    }
    else {
        if(conf.cnt.hasOwnProperty(count)) {
            var parent = conf.cnt[count].parent;
            var rn = conf.cnt[count].name;
            sh_adn.crtct(parent, rn, count, function (rsc, res_body) {
                if (rsc == 5106 || rsc == 2001 || rsc == 4105) {
                    create_cnt_all(++count, function (status, count) {
                        callback(status, count);
                    });
                }
                else {
                    callback(9999, count);
                }
            });
        }
        else {
            callback(2001, count);
        }
    }
}

function delete_sub_all(count, callback) {
    if(conf.sub.length == 0) {
        callback(2001, count);
    }
    else {
        if(conf.sub.hasOwnProperty(count)) {
            var target = conf.sub[count].parent + '/' + conf.sub[count].name;
            sh_adn.delsub(target, count, function (rsc, res_body) {
                if (rsc == 5106 || rsc == 2002 || rsc == 2000 || rsc == 4105 || rsc == 4004) {
                    delete_sub_all(++count, function (status, count) {
                        callback(status, count);
                    });
                }
                else {
                    callback(9999, count);
                }
            });
        }
        else {
            callback(2001, count);
        }
    }
}

function create_sub_all(count, callback) {
    if(conf.sub.length == 0) {
        callback(2001, count);
    }
    else {
        if(conf.sub.hasOwnProperty(count)) {
            var parent = conf.sub[count].parent;
            var rn = conf.sub[count].name;
            var nu = conf.sub[count].nu;
            sh_adn.crtsub(parent, rn, nu, count, function (rsc, res_body, count) {
                if (rsc == 5106 || rsc == 2001 || rsc == 4105) {
                    create_sub_all(++count, function (status, count) {
                        callback(status, count);
                    });
                }
                else {
                    callback('9999', count);
                }
            });
        }
        else {
            callback(2001, count);
        }
    }
}

function mqtt_watchdog() {
    if(sh_state == 'connect') {
    }
    else if(sh_state == 'crtae') {
        sh_adn.crtae(conf.ae.parent, conf.ae.name, conf.ae.appid, function (status, res_body) {
            console.log(res_body);
            if (status == 2001) {
                ae_response_action(status, res_body, function (status, aeid) {
                    console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');
                    sh_state = 'rtvae';
                    request_count = 0;
                    return_count = 0;

                    setTimeout(http_watchdog, 100);
                });
            }
            else if (status == 5106 || status == 4105) {
                console.log('x-m2m-rsc : ' + status + ' <----');
                sh_state = 'rtvae';

                setTimeout(mqtt_watchdog, 100);
            }
            else {
                setTimeout(mqtt_watchdog, 1000);
            }
        });
    }
    else if(sh_state == 'rtvae') {
        if (conf.ae.id === 'S') {
            conf.ae.id = 'S' + shortid.generate();
        }

        console.log('[sh_state] : ' + sh_state);
        sh_adn.rtvae(conf.ae.parent + '/' + conf.ae.name, function (status, res_body) {
            if (status == 2000) {
                var aeid = res_body['m2m:ae']['aei'];
                console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');

                if(conf.ae.id != aeid && conf.ae.id != ('/'+aeid)) {
                    console.log('AE-ID created is ' + aeid + ' not equal to device AE-ID is ' + conf.ae.id);
                }
                else {
                    sh_state = 'crtct';
                    request_count = 0;
                    return_count = 0;

                    setTimeout(mqtt_watchdog, 100);
                }
            }
            else {
                console.log('x-m2m-rsc : ' + status + ' <----');
                setTimeout(mqtt_watchdog, 1000);
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

        console.log('[sh_state] : ' + sh_state);
        create_cnt_all(request_count, function (status, count) {
            if(status == 9999) {
                setTimeout(mqtt_watchdog, 1000);
            }
            else {
                sh_state = 'delsub';
                request_count = 0;
                return_count = 0;

                setTimeout(mqtt_watchdog, 100);
            }
        });
    }
    else if (sh_state === 'delsub') {
        console.log('[sh_state] : ' + sh_state);
        delete_sub_all(request_count, function (status, count) {
            if(status == 9999) {
                setTimeout(mqtt_watchdog, 1000);
            }
            else {
                sh_state = 'crtsub';
                request_count = 0;
                return_count = 0;

                setTimeout(mqtt_watchdog, 100);
            }
        });
    }
    else if (sh_state === 'crtsub') {
        console.log('[sh_state] : ' + sh_state);
        create_sub_all(request_count, function (status, count) {
            if(status == 9999) {
                setTimeout(mqtt_watchdog, 1000);
            }
            else {
                sh_state = 'crtci';

                //ready_for_notification();

                tas.ready();

                setTimeout(mqtt_watchdog, 100);
            }
        });
    }
    else if (sh_state === 'crtci') {
    }
}

//wdt.set_wdt(require('shortid').generate(), 2, mqtt_watchdog);
setTimeout(mqtt_watchdog, 100);
