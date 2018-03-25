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
 * Created by Il-Yeup Ahn on 2016-11-18.
 */

var js2xmlparser = require("js2xmlparser");
var xml2js = require('xml2js');
var shortid = require('shortid');
var coap = require('coap');
var cbor = require('cbor');

var responseBody = {};

function coap_request(path, method, ty, bodyString, callback) {
    var options = {
        host: conf.cse.host,
        port: conf.cse.port,
        pathname: path,
        method: method,
        confirmable: 'false',
        options: {
            'Accept': 'application/'+conf.ae.bodytype
        }
    };

    if(bodyString.length > 0) {
        options.options['Content-Length'] = bodyString.length;
    }

    if(method === 'post') {
        var a = (ty==='') ? '': ('; ty='+ty);
        options.options['Content-Type'] = 'application/' + conf.ae.bodytype + a;
    }
    else if(method === 'put') {
        options.options['Content-Type'] = 'application/' + conf.ae.bodytype;
    }

    var res_body = '';
    var req = coap.request(options);
    req.setOption("256", new Buffer(conf.ae.id));      // X-M2M-Origin
    req.setOption("257", new Buffer(shortid.generate()));    // X-M2M-RI

    if(method === 'post') {
        var ty_buf = new Buffer(1);
        ty_buf.writeUInt8(parseInt(ty, 10), 0);
        req.setOption("267", ty_buf);    // X-M2M-TY
    }

    req.on('response', function (res) {
        res.on('data', function () {
            res_body += res.payload.toString();
        });

        res.on('end', function () {
            console.log(res_body);
            if(conf.ae.bodytype == 'xml') {
                var parser = new xml2js.Parser({explicitArray: false});
                parser.parseString(res_body, function (err, jsonObj) {
                    if (err) {
                        console.log('[http_adn] xml2js parser error]');
                    }
                    else {
                        callback(res, jsonObj);
                    }
                });
            }
            else if(conf.ae.bodytype == 'cbor') {
                cbor.decodeFirst(res_body, function(err, jsonObj) {
                    if (err) {
                        console.log('[http_adn] cbor parser error]');
                    }
                    else {
                        callback(res, jsonObj);
                    }
                });
            }
            else {
                var jsonObj = JSON.parse(res_body);
                callback(res, jsonObj);
            }
        });
    });

    req.on('error', function (e) {
        console.log(e);
    });

    req.write(bodyString);
    req.end();
}

exports.crtae = function (callback) {
    var results_ae = {};

    var bodyString = '';

    if(conf.ae.bodytype === 'xml') {
        results_ae.api = conf.ae.appid;
        results_ae.rr = 'true';
        results_ae['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "rn" : conf.ae.name
        };

        bodyString = js2xmlparser.parse("m2m:ae", results_ae);
    }
    else if(conf.ae.bodytype === 'cbor') {
        results_ae['m2m:ae'] = {};
        results_ae['m2m:ae'].api = conf.ae.appid;
        results_ae['m2m:ae'].rn = conf.ae.name;
        results_ae['m2m:ae'].rr = true;
        bodyString = cbor.encode(results_ae).toString('hex');
        console.log(bodyString);
    }
    else {
        results_ae['m2m:ae'] = {};
        results_ae['m2m:ae'].api = conf.ae.appid;
        results_ae['m2m:ae'].rn = conf.ae.name;
        results_ae['m2m:ae'].rr = true;
        //results_ae['m2m:ae'].acpi = '/mobius-yt/acp1';
        bodyString = JSON.stringify(results_ae);
    }

    coap_request(conf.ae.parent, 'post', '2', bodyString, function (res, res_body) {
        for (var idx in res.options) {
            if (res.options.hasOwnProperty(idx)) {
                if (res.options[idx].name === '265') { // 'X-M2M-RSC
                    var rsc = (Buffer.isBuffer(res.options[idx].value) ? res.options[idx].value.readUInt16BE(0).toString() : res.options[idx].value.toString());
                    break;
                }
            }
        }
        callback(rsc, res_body);
    });
};

exports.rtvae = function (callback) {
    coap_request(conf.ae.parent + '/' + conf.ae.name, 'get', '', '', function (res, res_body) {
        for (var idx in res.options) {
            if (res.options.hasOwnProperty(idx)) {
                if (res.options[idx].name === '265') { // 'X-M2M-RSC
                    var rsc = (Buffer.isBuffer(res.options[idx].value) ? res.options[idx].value.readUInt16BE(0).toString() : res.options[idx].value.toString());
                    break;
                }
            }
        }
        callback(rsc, res_body);
    });
};


exports.crtct = function(parent, rn, count, callback) {
    var results_ct = {};

    var bodyString = '';
    if(conf.ae.bodytype === 'xml') {
        results_ct.lbl = rn;
        results_ct['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "rn": rn
        };

        bodyString = js2xmlparser.parse("m2m:cnt", results_ct);
    }
    else if(conf.ae.bodytype === 'cbor') {
        results_ct['m2m:cnt'] = {};
        results_ct['m2m:cnt'].rn = rn;
        results_ct['m2m:cnt'].lbl = [rn];
        bodyString = cbor.encode(results_ct).toString('hex');
        console.log(bodyString);
    }
    else {
        results_ct['m2m:cnt'] = {};
        results_ct['m2m:cnt'].rn = rn;
        results_ct['m2m:cnt'].lbl = [rn];
        bodyString = JSON.stringify(results_ct);
    }

    coap_request(parent, 'post', '3', bodyString, function (res, res_body) {
        for (var idx in res.options) {
            if (res.options.hasOwnProperty(idx)) {
                if (res.options[idx].name === '265') { // 'X-M2M-RSC
                    var rsc = (Buffer.isBuffer(res.options[idx].value) ? res.options[idx].value.readUInt16BE(0).toString() : res.options[idx].value.toString());
                    break;
                }
            }
        }
        console.log(count + ' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + rsc + ' <----');
        callback(rsc, res_body, count);
    });
};


exports.crtsub = function(parent, rn, nu, count, callback) {
    var results_ss = {};
    var bodyString = '';
    if(conf.ae.bodytype === 'xml') {
        //results_ss.rn = name;
        results_ss.enc = {net:[3]};
        results_ss.nu = [nu];
        results_ss.nct = 2;
        results_ss['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "rn": rn
        };

        bodyString = js2xmlparser.parse("m2m:sub", results_ss);
    }
    else if(conf.ae.bodytype === 'cbor') {
        results_ss['m2m:sub'] = {};
        results_ss['m2m:sub'].rn = rn;
        results_ss['m2m:sub'].enc = {net: [3]};
        results_ss['m2m:sub'].nu = [nu];
        results_ss['m2m:sub'].nct = 2;
        bodyString = cbor.encode(results_ss).toString('hex');
        console.log(bodyString);
    }
    else {
        results_ss['m2m:sub'] = {};
        results_ss['m2m:sub'].rn = rn;
        results_ss['m2m:sub'].enc = {net:[3]};
        results_ss['m2m:sub'].nu = [nu];
        results_ss['m2m:sub'].nct = 2;

        bodyString = JSON.stringify(results_ss);
    }

    coap_request(parent, 'post', '23', bodyString, function (res, res_body) {
        for (var idx in res.options) {
            if (res.options.hasOwnProperty(idx)) {
                if (res.options[idx].name === '265') { // 'X-M2M-RSC
                    var rsc = (Buffer.isBuffer(res.options[idx].value) ? res.options[idx].value.readUInt16BE(0).toString() : res.options[idx].value.toString());
                    break;
                }
            }
        }
        console.log(count + ' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + rsc + ' <----');
        callback(rsc, res_body, count);
    });
};

exports.delsub = function(target, count, callback) {
    coap_request(target, 'delete', '', '', function (res, res_body) {
        for (var idx in res.options) {
            if (res.options.hasOwnProperty(idx)) {
                if (res.options[idx].name === '265') { // 'X-M2M-RSC
                    var rsc = (Buffer.isBuffer(res.options[idx].value) ? res.options[idx].value.readUInt16BE(0).toString() : res.options[idx].value.toString());
                    break;
                }
            }
        }
        console.log(count + ' - ' + target + ' - x-m2m-rsc : ' + rsc + ' <----');
        callback(rsc, res_body, count);
    });
};

exports.crtci = function(parent, count, content, socket, callback) {
    var results_ci = {};
    var bodyString = '';
    if(conf.ae.bodytype === 'xml') {
        results_ci.con = content;

        results_ci['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        bodyString = js2xmlparser.parse("m2m:cin", results_ci);
    }
    else if(conf.ae.bodytype === 'cbor') {
        results_ci['m2m:cin'] = {};
        results_ci['m2m:cin'].con = content;
        bodyString = cbor.encode(results_ci).toString('hex');
        console.log(bodyString);
    }
    else {
        results_ci['m2m:cin'] = {};
        results_ci['m2m:cin'].con = content;

        bodyString = JSON.stringify(results_ci);
    }

    coap_request(parent, 'post', '4', bodyString, function (res, res_body) {
        for (var idx in res.options) {
            if (res.options.hasOwnProperty(idx)) {
                if (res.options[idx].name == '265') { // 'X-M2M-RSC
                    var rsc = (Buffer.isBuffer(res.options[idx].value) ? res.options[idx].value.readUInt16BE(0).toString() : res.options[idx].value.toString());
                    break;
                }
            }
        }
        callback(rsc, res_body, parent, socket);
    });
};

