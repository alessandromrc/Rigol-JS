const { RigolConnector } = require("./rigol_features/rigol");

const instrument_ip = "192.168.178.98";
const instrument_port = 5555;

async function Main() {
  const Rigol = new RigolConnector(instrument_ip, instrument_port);
  await Rigol.Device.stop();
  console.log("System Language: " + (await Rigol.system.getLanguage()));

  await Rigol.features.Screenshot("./screenshots/example");

  await Rigol.util.sleep(50);

  await Rigol.Device.start();

  console.log("Scope Video Standard: " + await Rigol.trigger.getVideoStandard())

  console.log("Scope Channels :" + await Rigol.system.getRAM())

  for (let i = 0; i < 10; i++) {
    await Rigol.Display.setGrid("NONE");
    await Rigol.util.sleep(100);
    await Rigol.Display.setGrid("HALF");
    await Rigol.util.sleep(100);
    await Rigol.Display.setGrid("FULL");
    await Rigol.util.sleep(100);
  }

  let BeeperStatus = await Rigol.system.getBeeper();

  for (let i = 0; i < 10; i++) {
    await Rigol.Device.stop();
    await Rigol.util.sleep(100);
    await Rigol.system.setBeeper(0);
    await Rigol.Device.start();
    await Rigol.system.setBeeper(1);
    await Rigol.util.sleep(100);
  }

  await Rigol.system.setBeeper(BeeperStatus);

  const brightness = await Rigol.Display.getGridBrightness();

  for (let i = 0; i < 100; i++) {
    await Rigol.Display.setGridBrightness(i);
    await Rigol.util.sleep(10);
  }

  for (let i = 100; i > 0; i--) {
    await Rigol.Display.setGridBrightness(i);
    await Rigol.util.sleep(50);
  }

  await Rigol.Display.setGridBrightness(brightness);

  await Rigol.Cursor.setCursorMode("AUTO");
  await Rigol.util.sleep(50);
  await Rigol.Cursor.setCursorMode("OFF");

  console.log("Trigger Edge Value: " + (await Rigol.trigger.getEdgeLevel()));

  console.log("Display Type: " + (await Rigol.Display.getType()));

  await Rigol.Device.autoscale();


}

Main();
