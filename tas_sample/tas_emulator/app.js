/**
 * Created by ryeubi on 2015-08-31.
 * Updated 2017.03.06
 * Made compatible with Thyme v1.7.2
 */

var net = require('net');
var util = require('util');
var fs = require('fs');
var xml2js = require('xml2js');

var wdt = require('./wdt');

const path = require('path');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

//var sh_serial = require('./serial');

// var SerialPort = require('serialport');

// var usecomport = '';
// var usebaudrate = '';
var useparentport = '';
var useparenthostname = '';

var upload_arr = [];
// dataset 만들때 사용, IPE 폴더 내 conf.xml <download>확인하기
// var download_arr = [];

var conf = {};

// This is an async file read
//conf.xml 파일 읽어서 data 파싱하는 부분, xml을 자바스크립트 파싱
fs.readFile('conf.xml', 'utf-8', function (err, data) {
    if (err) {
        console.log("FATAL An error occurred trying to read in the file: " + err);
        console.log("error : set to default for configuration")
    }
    else {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(data, function (err, result) {
            if (err) {
                console.log("Parsing An error occurred trying to read in the file: " + err);
                console.log("error : set to default for configuration")
            }
            else {
                //stringfy는 자바스크립트 값을 JSON 문자열로 변환
                //JSON.stringfy(value, replacer, space): value만 필수
                var jsonString = JSON.stringify(result);
                conf = JSON.parse(jsonString)['m2m:conf'];

                // usecomport = conf.tas.comport;
                // usebaudrate = conf.tas.baudrate;

                //conf.xml의 parenthostname 사용하는 부분, thyme.js로 연결하는것
                useparenthostname = conf.tas.parenthostname;
                useparentport = conf.tas.parentport;

                //upload는 기존 cnt-co2부분
                if(conf.upload != null) {
                    if (conf.upload['ctname'] != null) {
                        //여기로 안 들어옴
                        upload_arr[0] = conf.upload;

                    }
                    else {
                        upload_arr = conf.upload;
                        console.log('upload_arr -> conf.upload :' + upload_arr[0]);
                    }
                }

                //download는 기존 cnt-led부분
                // if(conf.download != null) {
                //     if (conf.download['ctname'] != null) {
                //         download_arr[0] = conf.download;
                //     }
                //     else {
                //         download_arr = conf.download;
                //     }
                // }
            }
        });
    }
});


var tas_state = 'init';

var upload_client = null;

var t_count = 0;




function timer_upload_action() {
    if (tas_state == 'upload') {

        //cin의 content 랜덤값 생성부

        //data 컨테이너 cin content 값 (DAT00, DAT01, ~ ,DAT44)
        /*        var con = {dat00: Math.random(), dat01: Math.random(), dat02: Math.random(), dat03: Math.random(), dat04: Math.random(), dat44: Math.random()};*/

        var now = new Date();
        var second = 1000 * 60;
        var fmt1 = 'YYYYMMDDHHmmss';
//        var fmt2 = 'YYMMDDhhmmss';
//        console.log('==== ct : ' + ct);
        var ct = moment(now).format(fmt1); //Date 객체를 파라미터로 넣기
        //console.log(moment(now.getTime() + second).format(fmt1)); //밀리초를 파라미터로 넣기
        console.log('**TIME: ' + ct);

//        console.log(moment(now.replace(/[.]/g, '')).format(fmt2)); //문자열로된 날짜를 파라미터로 넣기

        /*        console.log('==== fmt1: ' + fmt1+ '==== fmt1 type: ' + typeof fmt1);
                console.log('==== fmt2: ' + fmt2 + '==== fmt2 type: ' + typeof fmt2);
                console.log('==== now :' + now + '====now type: ' + typeof now);*/

        var hi = (Math.random() * 10) + 1;
        console.log('hi == :' + hi);
        //var hifmt = '%014d';
        //var hihi = Math.random(hi).format(hifmt);
        //console.log('hihi == :' + hihi);

        var a = '12345';
        var b = 12345;
        //var w = util.format('%010d', a);  //0 은 왼쪽에 채울 숫자, 6 은 자릿수, 1은 실제 숫자 값
        //console.log('**** w == : ' + w);


        var util = require('util');
        var data = util.format('%010d, %s', b, a);



        console.log('****** result : ' +  data);

        //console.log(String.format('%02d', 8));

        console.log('test----------------------------');

        //종류:
        // (1) %014d : 정수 14자리, 앞을 0으로
        // (2) %010.4f : 정수 10자리, 앞을 0으로 + 소수4자리
        // (3) %010d : 정수 10자리, 앞을 0으로
        // (4) %011d : 정수 11자리, 앞을 0으로


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

//examples
        console.log(padLeft(Math.floor(Math.random() * 1000) + 1,14));       //=> (1) '14자리 :0 +랜덤값'
        console.log(padLeft(Math.floor(Math.random() * 1000) + 1,10) + '.' + padLeft(makeRandom(0, 9999), 4));       //=> (2) '10자리 :0 , 소수 4자리 +랜덤값'
        console.log(padLeft(Math.floor(Math.random() * 1000) + 1,10));       //=> (3) '10자리 :0 +랜덤값'
        console.log(padLeft(Math.floor(Math.random() * 1000) + 1,11));       //=> (4) '11자리 :0 +랜덤값'

        //console.log((Math.floor(Math.random() * 1000) + 1).padLeft(5));     //=> '00023'
        //console.log((a).padLeft(5,' ')); //=> '   23'
        //console.log(padLeft(a,5,'>>'));  //=> '>>>>>>23'




        console.log('test----------------------------');


        var type1 = padLeft(Math.floor(Math.random() * 1000) + 1,14);       //=> (1)
        var type2 = padLeft(Math.floor(Math.random() * 1000) + 1,10) + '.' + padLeft(makeRandom(0, 9999), 4);    //=> (2)
        var type3 = padLeft(Math.floor(Math.random() * 1000) + 1,10);       //=> (3)
        var type4 = padLeft(Math.floor(Math.random() * 1000) + 1,11);       //=> (4)

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
        var im = fs.readFileSync('/Users/jhlee/Desktop/emulator/emulator/imgfile/hi.tiff', 'base64');
        //console.log('** BASE64 result:' + im);

        var icon = {
            ct,
            im
        };


        for (var i = 0; i < upload_arr.length; i++) {
            if (upload_arr[i].id == 'near_ir') {
                var cin = {ctname: upload_arr[i].ctname, con: icon};
                //console.log(JSON.stringify(cin) + ' ---->');
                upload_client.write(JSON.stringify(cin) + '<EOF>');
                continue;
            }
            else if (upload_arr[i].id == 'red_edge') {
                var cin = {ctname: upload_arr[i].ctname, con: icon};
                //console.log(JSON.stringify(cin) + ' ---->');
                upload_client.write(JSON.stringify(cin) + '<EOF>');
                continue;
            }
            else if (upload_arr[i].id == 'blue') {
                var cin = {ctname: upload_arr[i].ctname, con: icon};
                //console.log(JSON.stringify(cin) + ' ---->');
                upload_client.write(JSON.stringify(cin) + '<EOF>');
                continue;
            }
            else if (upload_arr[i].id == 'green') {
                var cin = {ctname: upload_arr[i].ctname, con: icon};
                //console.log(JSON.stringify(cin) + ' ---->');
                upload_client.write(JSON.stringify(cin) + '<EOF>');
                continue;
            }
            else if (upload_arr[i].id == 'red') {
                var cin = {ctname: upload_arr[i].ctname, con: icon};
                //console.log(JSON.stringify(cin) + ' ---->');
                upload_client.write(JSON.stringify(cin) + '<EOF>');
                continue;
            }
            else if (upload_arr[i].id == 'data') {
                var cin = {ctname: upload_arr[i].ctname, con: con};
                console.log(JSON.stringify(cin) + ' ---->');
                upload_client.write(JSON.stringify(cin) + '<EOF>');
                continue;
            }
        }

        console.log('** icon - ct: ' + ct);
    }
}

/////////// base64 decode
/*        var imagesample = path.basename('/Users/jiholee/Downloads/hi.jpeg');
        var fs = require('fs');
// 파일시스템 모듈을 이용하여 이미지를 읽은후 base64로 인코딩하기
        function base64_encode(imagesmaple) {
            // 바이너리 데이터 읽기 file 에는 파일의 경로를 지정
            var bitmap = fs.readFileSync(imagesample);
            //바이너리 데이터를 base64 포멧으로 인코딩하여 스트링 획득
            return new Buffer(bitmap).toString('base64');
            console.log('** base64: ' + bitmap);
        }

// base64포멧의 스트링을 디코딩하여 파일로 쓰는 함수
        function base64_decode(base64str, file) {
            // 버퍼 객체를 만든후 첫번째 인자로 base64 스트링, 두번째 인자는 파일 경로를 지정 파일이름만 있으면 프로젝트 root에 생성
            var bitmap = new Buffer(base64str, 'base64');
            // 버퍼의 파일을 쓰기
            fs.writeFileSync(file, bitmap);
            console.log('******** base64로 인코딩되었던 파일 쓰기 성공 ********');
        }

// 파일을 base 64로 인코딩 하기
        var base64str = base64_encode('kitten.jpg');
        console.log(base64str);
// base64 포멧 스트링을 파일로 쓰기
        base64_decode(base64str, 'copy.jpg');*/


//////////decode



//upload하는 부분 - 후에 dataset 추가하는 IPE 만들 때 활용
// function serial_upload_action() {
//     if (tas_state == 'upload') {
//         var buf = new Buffer(4);
//         buf[0] = 0x11;
//         buf[1] = 0x01;
//         buf[2] = 0x01;
//         buf[3] = 0xED;
//         myPort.write(buf);
//     }
// }

// var tas_download_count = 0;

function on_receive(data) {
    if (tas_state == 'connect' || tas_state == 'reconnect' || tas_state == 'upload') {
        var data_arr = data.toString().split('<EOF>');
        if(data_arr.length >= 2) {
            for (var i = 0; i < data_arr.length - 1; i++) {
                var line = data_arr[i];
                var sink_str = util.format('%s', line.toString());
                var sink_obj = JSON.parse(sink_str);

                if (sink_obj.ctname == null || sink_obj.con == null) {
                    console.log('Received: data format mismatch');
                }
                else {
                    if (sink_obj.con == 'hello') {
                        console.log('Received: ' + line);

                        if (++tas_download_count >= download_arr.length) {
                            tas_state = 'upload';
                        }
                    }
                    else {
                        for (var j = 0; j < upload_arr.length; j++) {
                            if (upload_arr[j].ctname == sink_obj.ctname) {
                                console.log('ACK : ' + line + ' <----');
                                break;
                            }
                        }

                        for (j = 0; j < download_arr.length; j++) {
                            if (download_arr[j].ctname == sink_obj.ctname) {
                                g_down_buf = JSON.stringify({id: download_arr[i].id, con: sink_obj.con});
                                console.log(g_down_buf + ' <----');
                                myPort.write(g_down_buf);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}


var myPort = null;
function tas_watchdog() {
    if(tas_state == 'init') {
        upload_client = new net.Socket();

        upload_client.on('data', on_receive);

        upload_client.on('error', function(err) {
            console.log(err);
            tas_state = 'reconnect';
        });

        upload_client.on('close', function() {
            console.log('Connection closed');
            upload_client.destroy();
            tas_state = 'reconnect';
        });

        if(upload_client) {
            console.log('tas init ok');
            tas_state = 'init_serial';
        }
    }
    else if(tas_state == 'init_serial') {
        // SerialPort = serialport.SerialPort;
        //
        // serialport.list(function (err, ports) {
        //     ports.forEach(function (port) {
        //         console.log(port.comName);
        //     });
        // });

        // myPort = new SerialPort(usecomport, {
        //     baudRate : parseInt(usebaudrate, 10),
        //     buffersize : 1
        //     //parser : serialport.parsers.readline("\r\n")
        // });

        // myPort.on('open', showPortOpen);
        // myPort.on('data', saveLastestData);
        // myPort.on('close', showPortClose);
        // myPort.on('error', showError);

        // if(myPort) {
        //     console.log('tas init serial ok');
        tas_state = 'connect';
        // }
    }
    else if(tas_state == 'connect' || tas_state == 'reconnect') {
        upload_client.connect(useparentport, useparenthostname, function() {
            console.log('upload Connected');
            tas_download_count = 0;
            // for (var i = 0; i < download_arr.length; i++) {
            //     console.log('download Connected - ' + download_arr[i].ctname + ' hello');
            //     var cin = {ctname: download_arr[i].ctname, con: 'hello'};
            //     upload_client.write(JSON.stringify(cin) + '<EOF>');
            // }

            // if (tas_download_count >= download_arr.length) {
            tas_state = 'upload';
            // }
        });
    }
}

//sec 단위는 ms
wdt.set_wdt(require('shortid').generate(), 5000, timer_upload_action);
wdt.set_wdt(require('shortid').generate(), 3, tas_watchdog);
// wdt.set_wdt(require('shortid').generate(), 3, serial_upload_action);

// var cur_c = '';
// var pre_c = '';
// var g_sink_buf = '';
// var g_sink_ready = [];
// var g_sink_buf_start = 0;
// var g_sink_buf_index = 0;
// var g_down_buf = '';

// function showPortOpen() {
//     console.log('port open. Data rate: ' + myPort.options.baudRate);
// }

// var count = 0;
// function saveLastestData(data) {
//     var val = data.readUInt16LE(0, true);

//     if(g_sink_buf_start == 0) {
//         if(val == 0x16) {
//             count = 1;
//             g_sink_buf_start = 1;
//             g_sink_ready.push(val);
//         }
//     }
//     else if(g_sink_buf_start == 1) {
//         if(val == 0x05) {
//             count = 2;
//             g_sink_buf_start = 2;
//             g_sink_ready.push(val);
//         }
//     }
//     else if(g_sink_buf_start == 2) {
//         if(val == 0x01) {
//             count = 3;
//             g_sink_buf_start = 3;
//             g_sink_ready.push(val);
//         }
//     }
//     else if(g_sink_buf_start == 3) {
//         count++;
//         g_sink_ready.push(val);

//         if(count >= 9){
//             console.log(g_sink_ready);

//             /*CO2 통신 예제
//             SEND(4바이트) : 0x11, 0x01, 0x01, 0xED
//             Respond(8바이트) : 0x16, 0x05, 0x01, 0x02, 0x72, 0x01, 0xD6, 0x99
//             응답의 0x16, 0x05, 0x01 은 항상 같은 값을 가지며, 빨간색 글씨의 0x02, 0x72 가 농도를 나타내는 수치입니다.
//             (HEX) 0x0272 = 626
//             즉, 농도는 626 ppm 입니다. */

//             var nValue = g_sink_ready[3] * 256 + g_sink_ready[4];

//             console.log(nValue);

//             if(tas_state == 'upload') {
//                 for(var i = 0; i < upload_arr.length; i++) {
//                     if(upload_arr[i].ctname == 'cnt-co2') {
//                         var cin = {ctname: upload_arr[i].ctname, con: nValue.toString()};
//                         console.log('SEND : ' + JSON.stringify(cin) + ' ---->');
//                         upload_client.write(JSON.stringify(cin) + '<EOF>');
//                         break;
//                     }
//                 }
//             }

//             g_sink_ready = [];
//             count = 0;
//             g_sink_buf_start = 0;
//         }
//     }
// }

// function showPortClose() {
//     console.log('port closed.');
// }

// function showError(error) {
//     var error_str = util.format("%s", error);
//     console.log(error.message);
//     if (error_str.substring(0, 14) == "Error: Opening") {

//     }
//     else {
//         console.log('SerialPort port error : ' + error);
//     }
// }