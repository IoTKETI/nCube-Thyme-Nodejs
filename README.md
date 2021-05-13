# &Cube-Thyme for Node.js

## version 
2.5.0

## Introduction
&Cube-Thyme is an open source IoT device application entity based on the oneM2M (http://www.oneM2M.org) standard. &Cube-Thyme consists of three versions: Node.js version, Java version and Android version.

## Connectivity stucture
&Cube-Thyme implementation of oneM2M ADN-AE can be connected to MN-CSE or IN-CSE.
<div align="center">
<img src="https://user-images.githubusercontent.com/29790334/28315421-497cf0b4-6bf9-11e7-9e67-61e4c351c035.png" width="600"/>
</div>

## Installation
&Cube-Thyme for Node.js is developed with javascript of node.js.
<div align="center">
<img src="https://user-images.githubusercontent.com/29790334/28315422-497d1300-6bf9-11e7-92c7-a0f82d8b4a29.png" width="400"/>
</div><br/>

- [Node.js](https://nodejs.org/en/)<br/>
Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world. Node.js is very powerful in service impelementation because it provide a rich and free web service API. So, we use it to make RESTful API base on the oneM2M standard.
- [&Cube-Thyme for Node.js](https://github.com/IoTKETI/nCube-Thyme-Nodejs/archive/master.zip)<br/>
&Cube-Thyme for Node.js source codes are written in javascript. So they don't need any compilation or installation before running.

## Configuration
- Open the &Cube-Thyme for Node.js source home directory
- Install dependent libraries as below
```
 
 npm install
 
```
- Modify configuration file "conf.js" per your setting
```
 
conf.useprotocol = 'http';              // select one for 'http' or 'mqtt' or 'coap' or 'ws'
 
// build cse 
cse.host        = '203.253.128.161';    //CSE host IP
cse.port        = '7579';               //CSE http hosting port
cse.name        = 'Mobius';
cse.id          = '/Mobius';
cse.mqttport    = '1883';               //CSE mqtt broaker port
cse.wsport      = '7577';
 
// build ae
ae.name         = 'edu4';               //AE name
ae.id           = 'S' + ae.name;        //AE-ID
 
ae.parent       = '/' + cse.name;
ae.appid        = 'education';
ae.port         = '9727';
ae.bodytype     = 'json'; // select 'json' or 'xml' or 'cbor'
ae.tasport      = '3105';
 
// build cnt 
var count = 0;
cnt_arr[count] = {}; 
cnt_arr[count].parent = '/' + cse.name + '/' + ae.name;
cnt_arr[count++].name = 'cnt-co2';      //CNT name
cnt_arr[count] = {}; 
cnt_arr[count].parent = '/' + cse.name + '/' + ae.name;
cnt_arr[count++].name = 'cnt-led';      //CNT name
 
// build sub 
count = 0;
sub_arr[count] = {}; 
sub_arr[count].parent = '/' + cse.name + '/' + ae.name + '/' + cnt_arr[1].name;
sub_arr[count].name = 'sub-ctrl2';      //Subsctiption name
sub_arr[count++].nu = 'mqtt://' + cse.host + '/' + ae.id + '?ct=' + ae.bodytype;
 
```

## Running
Use node.js application execution command as below
```
node thyme.js
```

<div align="center">
<img src="https://user-images.githubusercontent.com/29790334/28315420-494a8138-6bf9-11e7-8947-9c0f78b67166.png" width="640"/>
</div><br/>

## Dependency Libraries
This is the list of library dependencies for &Cube:Thyme Node.js 

- body-parser
- cbor
- coap
- express
- fs
- http
- ip
- js2xmlparser
- morgan
- mqtt
- shortid
- twitter
- url
- util
- websocket
- xml2js
- xmlbuilder

## Document
If you want more details please dowload the full [installation guide document](https://github.com/IoTKETI/nCube-Thyme-Nodejs/blob/master/doc/User_Guide_Thyme_Nodejs_v2.0.0_KR.docx).

# Author
Il Yeup Ahn (iyahn@keti.re.kr; ryeubi@gmail.com)
