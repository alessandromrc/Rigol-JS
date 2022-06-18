const { RigolConnector } = require("./rigol_features/rigol");

const instrument_ip = "192.168.178.98";
const instrument_port = 5555;

async function Main() {
  const Rigol = new RigolConnector(instrument_ip, instrument_port);

  await Rigol.features.Screenshot("./screenshots/screenshot")
  .then(() => {
    console.log("Screenshot saved");
    setTimeout(() => { process.exit(0); }, 1000);
  })



}

Main();
