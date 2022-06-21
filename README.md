# Rigol-JS
Single File Library for Rigol DS1000Z series made with Javascript running on NodeJS


## Example code:

```javascript
const { RigolConnector } = require("./rigol_features/rigol"); // include library

// Oscilloscope Infos
const instrument_ip = "192.168.178.98"; // oscillosope ip Address
const instrument_port = 5555; // oscilloscope port

async function Main() {
  const Rigol = new RigolConnector(instrument_ip, instrument_port); // connect to the oscilloscope
  console.log("System Language: " + (await Rigol.system.getLanguage())); // get oscilloscope language
  setTimeout(() => { process.exit(0); }, 1000); // wait 1000 ms then exit the program
}

Main() // execute the main function

```
## Authors

* **alessandromrc** - *Main work* - [alessandromrc](https://github.com/alessandromrc)
