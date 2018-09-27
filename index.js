module.exports = class MLP115A2{
	constructor(comm, config){
		//ensure config is an object
		if(typeof config != 'object') config = {};

		//extend with default values
		this.config = Object.assign({
			tempScale: "c",
			pScale: 1
		}, config);

		//set default states and initialize
		this.comm = comm;
		this.addr = 0x60;
		this.initialized = false;
		this.status = {};
		this.coef = [];
		this.init();
	}
	init(){
		//Run initialization routine for the chip
		this.comm.readBytes(this.addr, 0x04, 8).then((b) => {
			this.coef = [];

			this.coef.push(signInt(((b[0] << 8) | b[1]), 16) / 8);
			this.coef.push(signInt(((b[2] << 8) | b[3]), 16) / 8192);
			this.coef.push(signInt(((b[4] << 8) | b[5]), 16) / 16384);
			this.coef.push(signInt(((b[6] << 8) | b[7]) >> 2, 16) / 4194304);

			this.initialized = true;
		}).catch((err) => {
			this.initialized = false;
			console.log(err);
		});
	}
	parseStatus(status){
		//parse the retrieved values into real world values

		var press = ((status[0] << 8) | status[1]) >> 6;
		var temp = ((status[2] << 8) | status[3]) >> 6;

		var pComp = this.coef[0] + (this.coef[1] + this.coef[3] * temp) * press + this.coef[2] * temp;
		//mbar
		this.status.pressure = (((65 / 1023) * pComp) + 50) * this.config.pScale;
		//celsius
		this.status.temperature = ( temp - 498) / -5.35 + 25;

		if(this.config.tempScale.toLowerCase() == "f") this.status.temperature = this.status.temperature * 1.8 + 32;
		else if(this.config.tempScale.toLowerCase() == "k") this.status.temperature += 273.15;

		return this.status;
	}
	get(){
		//Fetch the telemetry values from the chip
		return new Promise((fulfill, reject) => {
			this.comm.writeByte(this.addr, 0x12).then(() => {
				setTimeout(() => {
					this.comm.readBytes(this.addr, 0x00, 4).then((r) => {
						this.initialized = true;
						fulfill(this.parseStatus(r));
					}).catch((err) => {
						this.initialized = false;
						reject(err);
					});
				}, 10);
			}).catch((err) => {
				this.initialized = false;
				reject(err);
			});
		});
	}
};
function signInt(i, b){
	if(i.toString(2).length != b) return i;
	return -(((~i) & ((1 << (b-1))-1))+1);
}
