var comms = require('ncd-red-comm');
var MLP115A2 = require('./index.js');

/*
 * Allows use of a USB to I2C converter form ncd.io
 */
var port = '/dev/tty.usbserial-DN04EUP8';
var serial = new comms.NcdSerial(port, 115200);
var comm = new comms.NcdSerialI2C(serial, 0);

/*
 * Use the native I2C port on the Raspberry Pi
 */
//var comm = new comms.NcdI2C(1);

var config = {
	tempScale: "f",
	pScale: 1
};
var dac = new MLP115A2(comm, config);

function testGet(){
	if(dac.initialized){
		dac.get().then((r) => {
			console.log(r);
			setTimeout(testGet, 1000);
		}).catch(console.log);
	}else{
		dac.init();
		setTimeout(testGet, 1000);
	}
}

testGet();
