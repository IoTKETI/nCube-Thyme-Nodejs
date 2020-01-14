/**
 * Created by Il Yeup, Ahn in KETI on 2017-02-25.
 */

/**
 * Copyright (c) 2018, OCEAN
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// for TAS
var net = require('net');
var ip = require('ip');
var fs = require('fs');

var socket_arr = {};
exports.socket_arr = socket_arr;

var tas_buffer = {};
exports.buffer = tas_buffer;

var t_count = [];
t_count.push(0);
t_count.push(0);
t_count.push(0);

var MAX_SEND = 10000;

function test_timer_upload_action() {
    if (sh_state == 'crtci') {
        var parent = '/Mobius/test_iot_algae/pontoon_titania/data';
        var gap = parseInt(10 + Math.random() * 30);
        setTimeout(send_data_pontoon, gap, parent, pontoon_con);

        parent = '/Mobius/test_iot_algae/pontoon_titania/camera/red';
        gap = parseInt(10 + Math.random() * 30);
        setTimeout(send_im_pontoon, gap, parent, pontoon_icon);

        parent = '/Mobius/test_iot_algae/pontoon_titania/camera/near-ir';
        gap = parseInt(10 + Math.random() * 30);
        setTimeout(send_im_pontoon, gap, parent, pontoon_icon);

        parent = '/Mobius/test_iot_algae/pontoon_titania/camera/red-edge';
        gap = parseInt(10 + Math.random() * 30);
        setTimeout(send_im_pontoon, gap, parent, pontoon_icon);

        parent = '/Mobius/test_iot_algae/pontoon_titania/camera/green';
        gap = parseInt(10 + Math.random() * 30);
        setTimeout(send_im_pontoon, gap, parent, pontoon_icon);

        parent = '/Mobius/test_iot_algae/pontoon_titania/camera/blue';
        gap = parseInt(10 + Math.random() * 30);
        setTimeout(send_im_pontoon, gap, parent, pontoon_icon);
    }

    setTimeout(function () {
        build_data_pontoon();
    }, 60000);
}

function send_data_pontoon(parent, con) {
    sh_adn.crtci(parent, 0, con, function (status) {
        console.log('x-m2m-rsc : ' + status + ' <----');
    });
}

function send_im_pontoon(parent, icon) {
    sh_adn.crtci(parent, 0, icon, function (status) {
        console.log('x-m2m-rsc : ' + status + ' <----');
    });
}

var pontoon_con = {};
var pontoon_icon = {};
const moment = require('moment');

function build_data_pontoon() {
    function makeRandom(min, max){
        var RandVal = Math.floor(Math.random()*(max-min+1)) + min;
        return RandVal;
    }

    // var a = makeRandom(1, 1000);

    function padLeft(nr, n, str){
        return Array(n-String(nr).length+1).join(str||'0')+nr;
    }

//or as a Number prototype method:

    Number.prototype.padLeft = function(n,str){
        return Array(n-String(this).length+1).join(str||'0')+this;
    }

    var type1 = padLeft(Math.floor(Math.random() * 1000) + 1,14);       //=> (1)
    var type2 = padLeft(Math.floor(Math.random() * 1000) + 1,10) + '.' + padLeft(makeRandom(0, 9999), 4);    //=> (2)
    var type3 = padLeft(Math.floor(Math.random() * 1000) + 1,10);       //=> (3)
    var type4 = padLeft(Math.floor(Math.random() * 1000) + 1,11);       //=> (4)
    var ct = moment().format("YYYYMMDDhhmmss");
    var con = {
        dat00: ct,

        dat01: type2,
        dat02: type2,
        dat03: type2,
        dat04: type2,
        dat05: type2,
        dat06: type2,
        dat07: type2,
        dat08: type2,
        dat09: type2,
        dat10: type2,

        dat11: type2,
        dat12: type2,
        dat13: type2,
        dat14: type2,
        dat15: type3,
        dat16: type4,
        dat17: type2,
        dat18: type2,
        dat19: type2,
        dat20: type2,

        dat21: type2,
        dat22: type3,
        dat23: type3,
        dat24: type3,
        dat25: type3,
        dat26: type3,
        dat27: type2,
        dat28: type2,
        dat29: type2,
        dat30: type2,

        dat31: type3,
        dat32: type3,
        dat33: type3,
        dat34: type3,
        dat35: type3,
        dat36: type3,
        dat37: type3,
        dat38: type3,
        dat39: type3,
        dat40: type3,

        dat41: type3,
        dat42: type3,
        dat43: type3,
        dat44: type2
    };


    //camera 컨테이너 하위 5개 컨테이너 cin content cin content 값 (ct, im)
    //im: image 읽어와서 base64 변환수행
    var im = fs.readFileSync('./imgfile/hi.jpeg', 'base64');
    //console.log('** BASE64 result:' + im);

    var icon = {
        ct: ct,
        im: im
    };

    pontoon_con = JSON.parse(JSON.stringify(con));
    pontoon_icon = JSON.parse(JSON.stringify(icon));

    test_timer_upload_action();
}

var _server = null;
exports.ready = function tas_ready () {
    if(_server == null) {
        _server = net.createServer(function (socket) {
            console.log('socket connected');
            socket.id = Math.random() * 1000;
            tas_buffer[socket.id] = '';
            socket.on('data', tas_handler);
            socket.on('end', function() {
                console.log('end');
            });
            socket.on('close', function() {
                console.log('close');
            });
            socket.on('error', function(e) {
                console.log('error ', e);
            });
        });

        _server.listen(conf.ae.tasport, function() {
            console.log('TCP Server (' + ip.address() + ') for TAS is listening on port ' + conf.ae.tasport);
        });

        if(conf.sim == 'enable') {
            setTimeout(build_data_pontoon, 5000);
        }
    }
};

function tas_handler (data) {
    // 'this' refers to the socket calling this callback.
    tas_buffer[this.id] += data.toString();
    //console.log(tas_buffer[this.id]);
    var data_arr = tas_buffer[this.id].split('<EOF>');
    if(data_arr.length >= 2) {
        for (var i = 0; i < data_arr.length-1; i++) {
            var line = data_arr[i];
            tas_buffer[this.id] = tas_buffer[this.id].replace(line+'<EOF>', '');
            var jsonObj = JSON.parse(line);
            var ctname = jsonObj.ctname;
            var content = jsonObj.con;

            socket_arr[ctname] = this;

            console.log('----> got data for [' + ctname + '] from tas ---->');

            if (jsonObj.con == 'hello') {
                this.write(line + '<EOF>');
            }
            else {
                if (sh_state == 'crtci') {
                    for (var j = 0; j < conf.cnt.length; j++) {
                        if (conf.cnt[j].name == ctname) {
                            //console.log(line);
                            var parent = conf.cnt[j].parent + '/' + conf.cnt[j].name;
                            sh_adn.crtci(parent, j, content, function (status, res_body) {
                                try {
                                    var to_arr = parent.split('/');
                                    var ctname = to_arr[to_arr.length - 1];
                                    var result = {};
                                    result.ctname = ctname;
                                    result.con = status;

                                    console.log('<---- x-m2m-rsc : ' + status + ' <----');
                                    if (status == 5106 || status == 2001 || status == 4105) {
                                        socket.write(JSON.stringify(result) + '<EOF>');
                                    }
                                    else if (status == 5000) {
                                        sh_state = 'crtae';
                                        socket.write(JSON.stringify(result) + '<EOF>');
                                    }
                                    else if (status == 9999) {
                                        socket.write(JSON.stringify(result) + '<EOF>');
                                    }
                                    else {
                                        socket.write(JSON.stringify(result) + '<EOF>');
                                    }
                                }
                                catch (e) {
                                    console.log(e.message);
                                }
                            });
                            break;
                        }
                    }
                }
            }
        }
    }
}


exports.send_tweet = function(cinObj) {
    var fs = require('fs');
    var Twitter = require('twitter');

    var twitter_client = new Twitter({
        consumer_key: 'tV4cipDkQcMzZh8RAWsEToDP2',
        consumer_secret: '1rAIO5DCuFnRkYVefjst2ULVStBl6Dfucs2AVBjo1pcSx8jROT',
        access_token_key: '4157451558-lo0rgStwJ3ewEi47TpmrWnoDBPIRB3hcHeNggEk',
        access_token_secret: 'KlmoKMSvcWPuX1mcmuOd1SIvh8DyLXQD9ja3NeMoVCzdl'
    });

    var params = {screen_name: 'gbsmfather'};
    twitter_client.get('statuses/user_timeline', params, function(error, tweets, response){
        if (!error) {
            console.log(tweets[0].text);
        }
    });

    var cur_d = new Date();
    var cur_o = cur_d.getTimezoneOffset() / (-60);
    cur_d.setHours(cur_d.getHours() + cur_o);
    var cur_time = cur_d.toISOString().replace(/\..+/, '');

    var con_arr = (cinObj.con != null ? cinObj.con : cinObj.content).split(',');

    if (con_arr[con_arr.length-1] != null) {
        var bitmap = new Buffer(con_arr[con_arr.length-1], 'base64');
        fs.writeFileSync('decode.jpg', bitmap);

        twitter_client.post('media/upload', {media: bitmap}, function (error, media, response) {
            if (error) {
                console.log(error[0].message);
                return;
            }
            // If successful, a media object will be returned.
            console.log(media);

            // Lets tweet it
            var status = {
                status: '[' + cur_time + '] Give me water ! - ',
                media_ids: media.media_id_string // Pass the media id string
            };

            twitter_client.post('statuses/update', status, function (error, tweet, response) {
                if (!error) {
                    console.log(tweet.text);
                }
            });
        });
    }
};

exports.noti = function(path_arr, cinObj) {
    var cin = {};
    cin.ctname = path_arr[path_arr.length-2];
    cin.con = (cinObj.con != null) ? cinObj.con : cinObj.content;
    delete cinObj;
    cinObj = null;

    if(cin.con == '') {
        console.log('---- is not cin message');
    }
    else {
        //console.log(JSON.stringify(cin));
        console.log('<---- send to tas');

        if (socket_arr[path_arr[path_arr.length-2]] != null) {
            socket_arr[path_arr[path_arr.length-2]].write(JSON.stringify(cin) + '<EOF>');
        }
        delete cin;
        cin = null;
    }
};
