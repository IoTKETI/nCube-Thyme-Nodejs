/**
 * Created by ryeubi on 2015-08-31.
 * Updated 2017.03.06
 * Made compatible with Thyme v1.7.2
 */

let mqtt = require('mqtt');
let {nanoid} = require('nanoid');
let Gpio = require('onoff').Gpio;


/* USER CODE */
// for led set

let LED_G = new Gpio(17, 'out');
let LED_B = new Gpio(18, 'out');
let LED_R = new Gpio(27, 'out');

function led_control(light_type){
    if(light_type === 1){
        LED_R.writeSync(1);
        LED_G.writeSync(0);
        LED_B.writeSync(0);
    }
    else if(light_type === 2){
        LED_R.writeSync(0);
        LED_G.writeSync(1);
        LED_B.writeSync(0);
    }
    else if(light_type === 3){
        LED_R.writeSync(0);
        LED_G.writeSync(0);
        LED_B.writeSync(1);
    }
    else if(light_type === 4){
    }
    else{
        all_Gpio_off();
        console.log("not defined type")
    }
}

function all_Gpio_off(){
    LED_R.writeSync(0);
    LED_G.writeSync(0);
    LED_B.writeSync(0);
}

let tas = {
    client: {
        connected: false,
    },

    connection: {
        host: '192.168.50.58',
        port: 1883,
        endpoint: '',
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 4000,
        clientId: 'tas_' + nanoid(15),
        username: 'keti_thyme',
        password: 'keti_thyme',
    },
};

let sendDataTopic = {
    // co2: '/thyme/co2',
    // tvoc: '/thyme/tvoc',
    // temp: '/thyme/temp',
};

let recvDataTopic = {
    led: '/led/set',
};
/* */

let createConnection = () => {
    if (tas.client.connected) {
        console.log('Already connected --> destroyConnection')
        destroyConnection();
    }

    if (!tas.client.connected) {
        tas.client.loading = true;
        const {host, port, endpoint, ...options} = tas.connection;
        const connectUrl = `mqtt://${host}:${port}${endpoint}`
        try {
            tas.client = mqtt.connect(connectUrl, options);

            tas.client.on('connect', () => {
                console.log(host, 'Connection succeeded!');

                tas.client.connected = true;
                tas.client.loading = false;

                for(let topicName in recvDataTopic) {
                    if(recvDataTopic.hasOwnProperty(topicName)) {
                        doSubscribe(recvDataTopic[topicName]);
                    }
                }
            });

            tas.client.on('error', (error) => {
                console.log('Connection failed', error);

                destroyConnection();
            });

            tas.client.on('close', () => {
                console.log('Connection closed');

                destroyConnection();
            });

            tas.client.on('message', (topic, message) => {
                let content = null;

                /* USER CODES */
                if(topic === recvDataTopic.led) {
                    // LED 제어
                    console.log("led light type : ", JSON.parse(message.toString()));
                    led_control(JSON.parse(message.toString()));
                }
                /* */
            });
        }
        catch (error) {
            console.log('mqtt.connect error', error);
            tas.client.connected = false;
        }
    }
};

let doSubscribe = (topic) => {
    if (tas.client.connected) {
        const qos = 0;
        tas.client.subscribe(topic, {qos}, (error) => {
            if (error) {
                console.log('Subscribe to topics error', error)
                return;
            }

            console.log('Subscribe to topics (', topic, ')');
        });
    }
};

let doUnSubscribe = (topic) => {
    if (tas.client.connected) {
        tas.client.unsubscribe(topic, error => {
            if (error) {
                console.log('Unsubscribe error', error)
            }

            console.log('Unsubscribe to topics (', topic, ')');
        });
    }
};

let doPublish = (topic, payload) => {
    if (tas.client.connected) {
        tas.client.publish(topic, payload, 0, error => {
            if (error) {
                console.log('Publish error', error)
            }
        });
    }
};

let destroyConnection = () => {
    if (tas.client.connected) {
        try {
            if(Object.hasOwnProperty.call(tas.client, '__ob__')) {
                tas.client.end();
            }
            tas.client = {
                connected: false,
                loading: false
            }
            console.log(this.name, 'Successfully disconnected!');
        }
        catch (error) {
            console.log('Disconnect failed', error.toString())
        }
    }
};

createConnection();

/* USER CODE */

/* */
