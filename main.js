const { RigolConnector } = require("./rigol_features/rigol");

const instrument_ip = "192.168.178.98";
const instrument_port = 5555;

async function Main() {
  const Rigol = new RigolConnector(instrument_ip, instrument_port);

  console.log(await Rigol.waveform.getPreamble());

  //await Rigol.Screenshot("./screenshots/Square_NE555");


};


Main()
