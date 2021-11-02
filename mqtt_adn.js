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
 * Created by ryeubi on 2015-11-21.
 */

/**
 * Created by ryeubi on 2015-08-31.
 */

var http = require('http');
var js2xmlparser = require("js2xmlparser");
var xml2js = require('xml2js');
var shortid = require('shortid');
var cbor = require('cbor');

global.callback_q = {};

exports.crtae = function (parent, rn, api, callback) {
    var rqi = shortid.generate();

    callback_q[rqi] = callback;
    resp_mqtt_ri_arr.push(rqi);
    resp_mqtt_path_arr[rqi] = parent;

    var req_message = {};
    req_message['m2m:rqp'] = {};
    req_message['m2m:rqp'].op = '1'; // create
    req_message['m2m:rqp'].to = parent;
    req_message['m2m:rqp'].fr = conf.ae.id;
    req_message['m2m:rqp'].rqi = rqi;
    req_message['m2m:rqp'].ty = '2'; // ae
    req_message['m2m:rqp'].pc = {};
    req_message['m2m:rqp'].pc['m2m:ae'] = {};
    req_message['m2m:rqp'].pc['m2m:ae'].rn = rn;
    req_message['m2m:rqp'].pc['m2m:ae'].api = api;
    req_message['m2m:rqp'].pc['m2m:ae'].rr = true;

    if (conf.ae.bodytype == 'xml') {
        req_message['m2m:rqp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        req_message['m2m:rqp'].pc['m2m:ae']['@'] = {"rn": rn};
        delete req_message['m2m:rqp'].pc['m2m:ae'].rn;

        var bodyString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);
        console.log(bodyString);

        mqtt_client.publish(req_topic, bodyString);

        console.log(req_topic + ' (' + rqi + ' - xml) ---->');
    }
    else if(conf.ae.bodytype === 'cbor') {
        bodyString = cbor.encode(req_message['m2m:rqp']).toString('hex');
        mqtt_client.publish(req_topic, bodyString);
        console.log(req_topic + ' (cbor) ' + bodyString + ' ---->');
    }
    else { // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ' + JSON.stringify(req_message['m2m:rqp']) + ' ---->');
    }
};

exports.rtvae = function (target, callback) {
    var rqi = shortid.generate();

    callback_q[rqi] = callback;

    resp_mqtt_ri_arr.push(rqi);
    resp_mqtt_path_arr[rqi] = conf.ae.parent + '/' + conf.ae.name;

    var req_message = {};
    req_message['m2m:rqp'] = {};
    req_message['m2m:rqp'].op = '2'; // retrieve
    req_message['m2m:rqp'].to = target;
    req_message['m2m:rqp'].fr = conf.ae.id;
    req_message['m2m:rqp'].rqi = rqi;
    req_message['m2m:rqp'].pc = {};

    if (conf.ae.bodytype == 'xml') {
        req_message['m2m:rqp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        var bodyString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);
        console.log(bodyString);

        mqtt_client.publish(req_topic, bodyString);

        console.log(req_topic + ' (' + rqi + ' - xml) ---->');
    }
    else if(conf.ae.bodytype === 'cbor') {
        bodyString = cbor.encode(req_message['m2m:rqp']).toString('hex');
        mqtt_client.publish(req_topic, bodyString);
        console.log(req_topic + ' (cbor) ' + bodyString + ' ---->');
    }
    else { // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ---->');
    }
};


exports.udtae = function (path, callback) {
    // to do
};


exports.delae = function (path, callback) {
    // to do
};

exports.crtct = function(parent, rn, count, callback) {
    var rqi = shortid.generate();

    callback_q[rqi] = callback;

    resp_mqtt_ri_arr.push(rqi);
    resp_mqtt_path_arr[rqi] = conf.cnt[count].parent;

    var req_message = {};
    req_message['m2m:rqp'] = {};
    req_message['m2m:rqp'].op = '1'; // create
    req_message['m2m:rqp'].to = parent;
    req_message['m2m:rqp'].fr = conf.ae.id;
    req_message['m2m:rqp'].rqi = rqi;
    req_message['m2m:rqp'].ty = '3'; // cnt
    req_message['m2m:rqp'].pc = {};
    req_message['m2m:rqp'].pc['m2m:cnt'] = {};
    req_message['m2m:rqp'].pc['m2m:cnt'].rn = rn;
    req_message['m2m:rqp'].pc['m2m:cnt'].lbl = [];
    req_message['m2m:rqp'].pc['m2m:cnt'].lbl.push(rn);

    if (conf.ae.bodytype == 'xml') {
        req_message['m2m:rqp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        req_message['m2m:rqp'].pc['m2m:cnt']['@'] = {"rn": rn};
        delete req_message['m2m:rqp'].pc['m2m:cnt'].rn;

        var bodyString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);
        console.log(bodyString);
        
        mqtt_client.publish(req_topic, bodyString);

        console.log(req_topic + ' (' + rqi + ' - xml) ---->');
    }
    else if(conf.ae.bodytype === 'cbor') {
        bodyString = cbor.encode(req_message['m2m:rqp']).toString('hex');
        mqtt_client.publish(req_topic, bodyString);
        console.log(req_topic + ' (cbor) ' + bodyString + ' ---->');
    }
    else { // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ' + JSON.stringify(req_message['m2m:rqp']) + ' ---->');
    }
};


exports.rtvct = function(count, callback) {
    var rqi = shortid.generate();

    callback_q[rqi] = callback;

    resp_mqtt_ri_arr.push(rqi);
    resp_mqtt_path_arr[rqi] = conf.cnt[count].parent + '/' + conf.cnt[count].name;

    var req_message = {};
    req_message['m2m:rqp'] = {};
    req_message['m2m:rqp'].op = '2'; // retrieve
    req_message['m2m:rqp'].to = conf.cnt[count].parent + '/' + conf.cnt[count].name;
    req_message['m2m:rqp'].fr = conf.ae.id;
    req_message['m2m:rqp'].rqi = rqi;
    req_message['m2m:rqp'].pc = {};

    if (conf.ae.bodytype == 'xml') {
        req_message['m2m:rqp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        var bodyString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);
        console.log(bodyString);

        mqtt_client.publish(req_topic, bodyString);

        console.log(req_topic + ' (' + rqi + ' - xml) ---->');
    }
    else if(conf.ae.bodytype === 'cbor') {
        bodyString = cbor.encode(req_message['m2m:rqp']).toString('hex');
        mqtt_client.publish(req_topic, bodyString);
        console.log(req_topic + ' (cbor) ' + bodyString + ' ---->');
    }
    else { // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ---->');
    }
};


exports.udtct = function(path, callback) {
    // to do
};


exports.delct = function(path, callback) {
    // to do
};


exports.delsub = function(target, count, callback) {
    var rqi = shortid.generate();

    callback_q[rqi] = callback;

    resp_mqtt_ri_arr.push(rqi);
    resp_mqtt_path_arr[rqi] = target;

    var req_message = {};
    req_message['m2m:rqp'] = {};
    req_message['m2m:rqp'].op = '4'; // delete
    req_message['m2m:rqp'].to = target;
    req_message['m2m:rqp'].fr = conf.ae.id;
    req_message['m2m:rqp'].rqi = rqi;
    req_message['m2m:rqp'].pc = {};

    if (conf.ae.bodytype == 'xml') {
        req_message['m2m:rqp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        var bodyString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);
        console.log(bodyString);

        mqtt_client.publish(req_topic, bodyString);

        console.log(req_topic + ' (' + rqi + ' - xml) ---->');
    }
    else if(conf.ae.bodytype === 'cbor') {
        bodyString = cbor.encode(req_message['m2m:rqp']).toString('hex');
        mqtt_client.publish(req_topic, bodyString);
        console.log(req_topic + ' (cbor) ' + bodyString + ' ---->');
    }
    else { // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ---->');
    }
};

exports.crtsub = function(parent, rn, nu, count, callback) {
    var rqi = shortid.generate();

    callback_q[rqi] = callback;

    resp_mqtt_ri_arr.push(rqi);
    resp_mqtt_path_arr[rqi] = parent;

    var req_message = {};
    req_message['m2m:rqp'] = {};
    req_message['m2m:rqp'].op = '1'; // create
    req_message['m2m:rqp'].to = parent;
    req_message['m2m:rqp'].fr = conf.ae.id;
    req_message['m2m:rqp'].rqi = rqi;
    req_message['m2m:rqp'].ty = '23'; // sub
    req_message['m2m:rqp'].pc = {};
    req_message['m2m:rqp'].pc['m2m:sub'] = {};
    req_message['m2m:rqp'].pc['m2m:sub'].rn = rn;
    req_message['m2m:rqp'].pc['m2m:sub'].enc = {};
    req_message['m2m:rqp'].pc['m2m:sub'].enc.net = [];
    req_message['m2m:rqp'].pc['m2m:sub'].enc.net.push('3');
    req_message['m2m:rqp'].pc['m2m:sub'].nu = [];
    req_message['m2m:rqp'].pc['m2m:sub'].nu.push(nu);
    req_message['m2m:rqp'].pc['m2m:sub'].nct = '2';

    if (conf.ae.bodytype == 'xml') {
        req_message['m2m:rqp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        req_message['m2m:rqp'].pc['m2m:sub']['@'] = {"rn": conf.sub[count].name};
        delete req_message['m2m:rqp'].pc['m2m:sub'].rn;

        var bodyString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);
        console.log(bodyString);

        mqtt_client.publish(req_topic, bodyString);

        console.log(req_topic + ' (' + rqi + ' - xml) ---->');
    }
    else if(conf.ae.bodytype === 'cbor') {
        bodyString = cbor.encode(req_message['m2m:rqp']).toString('hex');
        mqtt_client.publish(req_topic, bodyString);
        console.log(req_topic + ' (cbor) ' + bodyString + ' ---->');
    }
    else { // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ' + JSON.stringify(req_message['m2m:rqp']) + ' ---->');
    }
};

exports.crtci = function(parent, count, content, callback) {
    var rqi = shortid.generate();

    callback_q[rqi] = callback;

    resp_mqtt_ri_arr.push(rqi);
    resp_mqtt_path_arr[rqi] = conf.cnt[count].parent + '/' + conf.cnt[count].name;

    var req_message = {};
    req_message['m2m:rqp'] = {};
    req_message['m2m:rqp'].op = '1'; // create
    req_message['m2m:rqp'].to = conf.cnt[count].parent + '/' + conf.cnt[count].name;
    req_message['m2m:rqp'].fr = conf.ae.id;
    req_message['m2m:rqp'].rqi = rqi;
    req_message['m2m:rqp'].ty = '4'; // cin
    req_message['m2m:rqp'].pc = {};
    req_message['m2m:rqp'].pc['m2m:cin'] = {};
    req_message['m2m:rqp'].pc['m2m:cin'].con = content;

    if (conf.ae.bodytype == 'xml') {
        req_message['m2m:rqp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        var bodyString = js2xmlparser.parse("m2m:rqp", req_message['m2m:rqp']);
        console.log(bodyString);

        mqtt_client.publish(req_topic, bodyString);

        console.log(req_topic + ' (' + rqi + ' - xml) ---->');
    }
    else if(conf.ae.bodytype === 'cbor') {
        bodyString = cbor.encode(req_message['m2m:rqp']).toString('hex');
        mqtt_client.publish(req_topic, bodyString);
        console.log(req_topic + ' (cbor) ' + bodyString + ' ---->');
    }
    else { // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ' + JSON.stringify(req_message['m2m:rqp']) + ' ---->');
    }
};

