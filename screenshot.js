const { RigolConnector } = require("./rigol_features/rigol");

const instrument_ip = "192.168.178.56";
const instrument_port = 5555;

const Rigol = new RigolConnector(instrument_ip, instrument_port);

async function Main() {
  let ts = Date.now();
  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();

  await Rigol.features.Screenshot("./screenshots/screenshot_" + hours + "_" + minutes + "_" + seconds + "__" + year + "_" + month + "_" + date)
    .then(() => {
      console.log("Screenshot saved");
      Main();
    })
}

Main();
