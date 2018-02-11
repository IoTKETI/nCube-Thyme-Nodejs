/**
 * Copyright (c) 2018, OCEAN, KETI
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Created by Il Yeup, Ahn in KETI on 2016-08-19.
 */

var fs = require('fs');
var shortid = require('shortid');

global.resp_mqtt_ri_arr = [];

global.resp_mqtt_path_arr = {};
global.socket_q = {};

global.conf = require('./conf.js');

//fs.writeFileSync('aei.json', JSON.stringify(conf, null, 4), 'utf-8');

//global.sh_state = 'rtvae';
global.sh_state = 'crtae';

global.wdt = require('./wdt');

global.mqtt_client = null;

// AE core
if(conf.useprotocol === 'mqtt') {
    require('./mqtt_app');
}
else if(conf.useprotocol === 'coap') {
    require('./coap_app');
}
else if(conf.useprotocol === 'ws') {
    require('./ws_app');
}
else {
    require('./http_app');
}

