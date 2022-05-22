const net = require("net");
const fs = require("fs");
const jimp = require("jimp");

const client = new net.Socket();
const date = new Date();
let conn_timeout = null;
let data_buf = Buffer.from([]);

class RigolConnector {
  constructor(ip, port) {
    client.connect(port, ip, () => {
      return 1;
    });
    return 0;
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  Screenshot(file_name) {
    return new Promise((resolve, reject) => {
      client.write("DISP:DATA?\n");
      client.on("data", (data) => {
        if (conn_timeout) {
          data_buf = Buffer.concat([data_buf, data]);
        } else {
          data_buf = data.slice(data.indexOf("BM"));
        }

        clearTimeout(conn_timeout);
        conn_timeout = setTimeout(() => {
          if (data_buf.length >= 1000) {
            jimp.read(data_buf).then((image) => {
              image.write(file_name + ".png");
              resolve(true);
            });
          } else {
            console.log("Socket timeout without sufficient data");
            reject(false);
          }
        }, 1000);
      });
    });
  }

  getDevice() {
    return new Promise((resolve) => {
      client.write("*IDN?\n");
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  DeviceStop() {
    client.write(":STOP\n");
  }

  DeviceStart() {
    client.write(":RUN\n");
  }

  DeviceClear() {
    client.write(":CLEAR\n");
  }

  DeviceAutoScale() {
    client.write(":AUToscale\n");
  }

  SingleTrigger() {
    client.write(":SINGle\n");
  }

  ForceTrigger() {
    client.write(":TFORce\n");
  }

  SetAverages(avg) {
    client.write(`:ACQUIRE:AVERAGES ${avg}\n`);
  }

  AcquireAverages() {
    return new Promise((resolve) => {
      client.write(`:ACQUIRE:AVERAGES?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  AcquireMemoryDepth() {
    return new Promise((resolve) => {
      client.write(`:ACQUIRE:MDEPth?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  SetMemoryDepth(depth) {
    client.write(`:ACQUIRE:MDEPth ${depth}\n`);
  }

  AcquireType() {
    return new Promise((resolve) => {
      client.write(`:ACQUIRE:TYPE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  SetType(depth) {
    client.write(`:ACQUIRE:TYPE ${depth}\n`);
  }

  AcquireSampleRate() {
    return new Promise((resolve) => {
      client.write(`:ACQUIRE:SRATE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  CalibrateQuit() {
    client.write(":CALIBRATE:QUIT\n");
  }

  CalibrateStart() {
    client.write(":CALIBRATE:START\n");
  }

  setChannelBandwitdhLimit(channel, limit) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    client.write(`:CHANNEL${channel}:BWLIMIT ${limit}\n`);
  }

  getChannelSampleRate(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:BWLIMIT?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelCoupling(channel, coupling_type) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    client.write(`:CHANNEL${channel}:COUPLING ${coupling_type}\n`);
  }

  getChannelCoupling(channel) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    return new Promise((resolve) => {
      client.write(`:CHANNEL${channel}:COUPLING?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  displayChannel(channel, value) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    switch (value) {
      case "ON":
        client.write(`:CHANNEL${channel}:DISPLAY ON\n`);
        break;
      case "OFF":
        client.write(`:CHANNEL${channel}:DISPLAY OFF\n`);
        break;
      case true:
        client.write(`:CHANNEL${channel}:DISPLAY ON\n`);
        break;
      case false:
        client.write(`:CHANNEL${channel}:DISPLAY OFF\n`);
        break;
      default:
        console.log("Invalid value for channel display");
    }
  }

  getChannelStatus(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:DISPLAY?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  invertChannel(channel, value) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    switch (value) {
      case "ON":
        client.write(`:CHANNEL${channel}:INVERT ON\n`);
        break;
      case "OFF":
        client.write(`:CHANNEL${channel}:INVERT OFF\n`);
        break;
      case true:
        client.write(`:CHANNEL${channel}:INVERT ON\n`);
        break;
      case false:
        client.write(`:CHANNEL${channel}:INVERT OFF\n`);
        break;
      default:
        console.log("Invalid value for invert channel");
    }
  }

  getInvertStatus(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:INVERT?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelOffset(channel, offset) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    client.write(`:CHANNEL${channel}:OFFSET ${offset}\n`);
  }

  getChannelOffset(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:OFFSET?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelRange(channel, range) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    client.write(`:CHANNEL${channel}:RANGE ${range}\n`);
  }

  getChannelRange(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:RANGE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelCalibrationTime(channel, time) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    client.write(`:CHANNEL${channel}:TCAL ${time}\n`);
  }

  getChannelCalibrationTime(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:TCAL?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelScale(channel, scale) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    client.write(`:CHANNEL${channel}:SCALE ${scale}\n`);
  }

  getChannelScale(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:SCALE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelProbeRatio(channel, ratio) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    client.write(`:CHANNEL${channel}:PROBE ${ratio}\n`);
  }

  getChannelProbeRatio(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:PROBE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelAmplitudeUnit(channel, unit) {
    if (typeof channel != "number") throw new Error("Channel must be a number");
    switch (unit.toString().toUpperCase()) {
      case "VOLT":
        client.write(`:CHANNEL${channel}:UNITS VOLT\n`);
        break;
      case "WATT":
        client.write(`:CHANNEL${channel}:UNITS WATT\n`);
        break;
      case "AMPERE":
        client.write(`:CHANNEL${channel}:UNITS AMP\n`);
        break;
      default:
        console.log("Invalid value for channel amplitude unit");
    }
  }

  getChannelAmplitudeUnit(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:UNITS?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setChannelVernier(channel, vernier_value) {
    switch (vernier_value) {
      case "ON":
        client.write(`:CHANNEL${channel}:VERNIER ON\n`);
        break;
      case "OFF":
        client.write(`:CHANNEL${channel}:VERNIER OFF\n`);
        break;
      case true:
        client.write(`:CHANNEL${channel}:VERNIER ON\n`);
        break;
      case false:
        client.write(`:CHANNEL${channel}:VERNIER OFF\n`);
        break;
      default:
        console.log("Invalid value for vernier");
    }
  }

  getChannelVernier(channel) {
    return new Promise((resolve) => {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:VERNIER?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setCursorMode(mode) {
    switch (mode.toString().toUpperCase()) {
      case "OFF":
        client.write(`:CURSOR:MODE OFF\n`);
        break;
      case "MANUAL":
        client.write(`:CURSOR:MODE MANUAL\n`);
        break;
      case "TRACK":
        client.write(`:CURSOR:MODE TRACK\n`);
        break;
      case "AUTO":
        client.write(`:CURSOR:MODE AUTO\n`);
        break;
      case "XY":
        client.write(`:CURSOR:MODE XY\n`);
        break;
      default:
        console.log("Invalid value for cursor mode");
    }
  }

  getCursorMode() {
    return new Promise((resolve) => {
      client.write(`:CURSOR:MODE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setCursorManualType(type) {
    switch (type.toString().toUpperCase()) {
      case "X":
        client.write(`:CURSOR:MANUAL:TYPE X\n`);
        break;
      case "Y":
        client.write(`:CURSOR:MANUAL:TYPE Y\n`);
        break;
      default:
        console.log("Invalid value for cursor manual type");
    }
  }

  getCursorManualType() {
    return new Promise((resolve) => {
      client.write(`:CURSOR:MANUAL:TYPE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setCursorManualSource(source) {
    client.write(`:CURSOR:MANUAL:SOURCE ${source}\n`);
  }

  getCursorManualSource() {
    return new Promise((resolve) => {
      client.write(`:CURSOR:MANUAL:SOURCE?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setCursorManualHorizontalUnit(unit) {
    switch (unit.toString().toUpperCase()) {
      case "S":
        client.write(`:CURSOR:MANUAL:TUNIT S\n`);
        break;
      case "HZ":
        client.write(`:CURSOR:MANUAL:TUNIT HZ\n`);
        break;
      case "DEGREE":
        client.write(`:CURSOR:MANUAL:TUNIT DEGR\n`);
        break;
      case "PERCENT":
        client.write(`:CURSOR:MANUAL:TUNIT PERC\n`);
        break;
      default:
        console.log("Invalid value for cursor manual horizontal unit");
    }
  }

  getCursorManualHorizontalUnit() {
    return new Promise((resolve) => {
      client.write(`:CURSOR:MANUAL:TUNIT?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  setCursorManualVerticalUnit(unit) {
    switch (unit.toString().toUpperCase()) {
      case "PERCENT":
        client.write(`:CURSOR:MANUAL:VUNIT PERC\n`);
        break;
      case "SOURCE":
        client.write(`:CURSOR:MANUAL:VUNIT SOUR\n`);
        break;
      default:
        console.log("Invalid value for cursor manual vertical unit");
    }
  }

  getCursorManualVerticalUnit() {
    return new Promise((resolve) => {
      client.write(`:CURSOR:MANUAL:VUNIT?\n`);
      client.on("data", (data) => {
        resolve(data.toString());
      });
    });
  }

}

module.exports.RigolConnector = RigolConnector;
