const net = require("net");
const fs = require("fs");
const jimp = require("jimp");

const client = new net.Socket();
const date = new Date();

class RigolConnector {
  constructor (ip, port) {
    client.connect(port, ip, () => {
      return 1;
    });
    return 0;
  }

  util = {
    sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    },
  };

  features = {
    Screenshot: function (file_name) {
      return new Promise((resolve, reject) => {
        let conn_timeout = null;
        let data_buf = [];

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
                image.getBuffer(jimp.MIME_PNG, (err, buffer) => {
                  fs.writeFile(file_name + ".png", buffer, (err) => {
                    if (err)
                      console.log(err);
                    else {
                      client.removeAllListeners(); // keeps us protected from memory leaks! :)
                      resolve(true);
                    }
                  });
                });
              });
            } else {
              console.log("Socket timeout without sufficient data");
              reject(false);
            }
          }, 1000);
        });
      });
    },
  };

  // Device Namespace
  Device = {
    get: function () {
      return new Promise((resolve) => {
        client.write("*IDN?\n");
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    stop: function () {
      client.write(":STOP\n");
    },

    start: function () {
      client.write(":RUN\n");
    },

    clear: function () {
      client.write(":CLEAR\n");
    },

    autoscale: function () {
      client.write(":AUTOSCALE\n");
    },
  };

  // Averages Namespace

  Averages = {
    set: function (avg) {
      client.write(`:ACQUIRE:AVERAGES ${avg}\n`);
    },

    get: function () {
      return new Promise((resolve) => {
        client.write(":ACQUIRE:AVERAGES?\n");
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  // MemoryDepth Namespace

  MemoryDepth = {
    get: function () {
      return new Promise((resolve) => {
        client.write(":ACQUIRE:MDEPth?\n");
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
    set: function (depth) {
      client.write(`:ACQUIRE:MDEPth ${depth}\n`);
    },
  };

  // Type Namespace

  Type = {
    get: function () {
      return new Promise((resolve) => {
        client.write(":ACQUIRE:TYPE?\n");
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
    set: function (type) {
      client.write(`:ACQUIRE:TYPE ${type}\n`);
    },
  };

  // SampleRate Namespace

  SampleRate = {
    get: function () {
      return new Promise((resolve) => {
        client.write(":ACQUIRE:SRATE?\n");
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  // Calibrate Namespace

  Calibrate = {
    quit: function () {
      client.write(":CALIBRATE:QUIT\n");
    },
    start: function () {
      client.write(":CALIBRATE:START\n");
    },
  };

  // Channel Namespace

  Channel = {
    bandwitdhLimit: function (channel, limit) {
      client.write(`:CHAN${channel}:BWLIM ${limit}\n`);
    },

    getSampleRate: function (channel) {
      return new Promise((resolve) => {
        client.write(`:CHANNEL${channel}:BWLIMIT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setCoupling: function (channel, coupling_type) {
      client.write(`:CHANNEL${channel}:COUPLING ${coupling_type}\n`);
    },

    getCoupling: function (channel) {
      return new Promise((resolve) => {
        client.write(`:CHANNEL${channel}:COUPLING?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    display: function (channel, value) {
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
    },

    getStatus: function (channel) {
      return new Promise((resolve) => {
        client.write(`:CHANNEL${channel}:DISPLAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    invert: function (channel, value) {
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
          console.log("Invalid value for channel invert");
      }
    },

    getInvertStatus: function (channel) {
      return new Promise((resolve) => {
        client.write(`:CHANNEL${channel}:INVERT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setOffset: function (channel, offset) {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:OFFSET ${offset}\n`);
    },

    getOffset: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:CHANNEL${channel}:OFFSET?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRange: function (channel, range) {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:RANGE ${range}\n`);
    },

    getRange: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:CHANNEL${channel}:RANGE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setCalibrationTime: function (channel, time) {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:TCAL ${time}\n`);
    },

    getCalibrationTime: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:CHANNEL${channel}:TCAL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getScale: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:CHANNEL${channel}:SCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setScale: function (channel, scale) {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:SCALE ${scale}\n`);
    },

    getProbeRatio: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:CHANNEL${channel}:PROBE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setProbeRatio: function (channel, ratio) {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
      client.write(`:CHANNEL${channel}:PROBE ${ratio}\n`);
    },

    setAmplitudeUnit: function (channel, unit) {
      if (typeof channel != "number")
        throw new Error("Channel must be a number");
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
    },

    getAmplitudeUnit: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:CHANNEL${channel}:UNITS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVernier: function (channel, vernier) {
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
    },

    getVernier: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:CHANNEL${channel}:VERNIER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  Cursor = {
    setCursorMode: function (mode) {
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
    },

    getMode: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setType: function (type) {
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
    },

    getType: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:TYPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSource: function (source) {
      client.write(`:CURSOR:MANUAL:SOURCE ${source}\n`);
    },

    getSource: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setHorizontalUnit: function (unit) {
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
    },

    getHorizontalUnit: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:TUNIT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVerticalUnit: function (unit) {
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
    },

    getVerticalUnit: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:VUNIT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAX: function (value) {
      client.write(`:CURSOR:MANUAL:AX ${value}\n`);
    },

    getAX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:AX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBX: function (value) {
      client.write(`:CURSOR:MANUAL:BX ${value}\n`);
    },

    getBX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:BX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAY: function (value) {
      client.write(`:CURSOR:MANUAL:AY ${value}\n`);
    },

    getAY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:AY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBY: function (value) {
      client.write(`:CURSOR:MANUAL:BY ${value}\n`);
    },

    getBY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:BY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:AXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:BXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:AYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:BYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getXdelta: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:XDelta?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getIXdelta: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:IXDelta?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getMYdelta: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:MANUAL:YDelta?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  CursorTrack = {
    setSource1: function (value) {
      client.write(`:CURSOR:TRACK:SOURCE1 ${value}\n`);
    },

    getSource1: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:SOURCE1?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSource2: function (value) {
      client.write(`:CURSOR:TRACK:SOURCE2 ${value}\n`);
    },

    getSource2: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:SOURCE2?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:AX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAX: function (value) {
      client.write(`:CURSOR:TRACK:AX ${value}\n`);
    },

    getBX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:BX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBX: function (value) {
      client.write(`:CURSOR:TRACK:BX ${value}\n`);
    },

    getAY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:AY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:BY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:AXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:BXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:AYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:BYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getXdelta: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:XDelta?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getIXdelta: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:IXDelta?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getYdelta: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:TRACK:YDelta?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  CursorAuto = {
    item: function (value) {
      client.write(`:CURSOR:AUTO:ITEM ${value}\n`);
    },

    getItem: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:ITEM?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:AX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:BX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:AY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:BY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:AXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:BXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:AYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:AUTO:BYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  CursorXY = {
    getAX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:AX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAX: function (value) {
      client.write(`:CURSOR:XY:AX ${value}\n`);
    },

    getBX: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:BX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBX: function (value) {
      client.write(`:CURSOR:XY:BX ${value}\n`);
    },

    getAY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:AY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAY: function (value) {
      client.write(`:CURSOR:XY:AY ${value}\n`);
    },

    getBY: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:BY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBY: function (value) {
      client.write(`:CURSOR:XY:BY ${value}\n`);
    },

    getAXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:AXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBXValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:BXValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getAYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:AYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getBYValue: function () {
      return new Promise((resolve) => {
        client.write(`:CURSOR:XY:BYValue?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  Decoder = {
    getMode: function () {
      return new Promise((resolve) => {
        client.write(`:DECODER:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMode: function (mode) {
      client.write(`:DECODER:MODE ${mode}\n`);
    },

    getDisplay: function () {
      return new Promise((resolve) => {
        client.write(`:DECODER:DISPLAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDisplay: function (display) {
      client.write(`:DECODER:DISPLAY ${display}\n`);
    },

    getFormat: function () {
      return new Promise((resolve) => {
        client.write(`:DECODER:FORMAT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFormat: function (format) {
      client.write(`:DECODER:FORMAT ${format}\n`);
    },

    getPosition: function () {
      return new Promise((resolve) => {
        client.write(`:DECODER:POSITION?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPosition: function (position) {
      client.write(`:DECODER:POSITION ${position}\n`);
    },

    setTreshold: function (channel, threshold) {
      client.write(
        `:DECODER${channel}:THRESHOLD:CHANNEL${channel} ${threshold}\n`
      );
    },

    getTreshold: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:THRESHOLD:CHANNEL${channel}?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setTresholdAuto: function (channel, threshold) {
      client.write(`:DECODER${channel}:THRESHOLD:AUTO$ ${threshold}\n`);
    },

    getTresholdAuto: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:THRESHOLD:AUTO?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setConfigLabel: function (channel, label) {
      client.write(`:DECODER${channel}:CONFIG:LABEL ${label}\n`);
    },

    getConfigLabel: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:CONFIG:LABEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setConfigLine: function (channel, line) {
      client.write(`:DECODER${channel}:CONFIG:LINE ${line}\n`);
    },

    getConfigLine: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:CONFIG:LINE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setConfigFormat: function (channel, format) {
      client.write(`:DECODER${channel}:CONFIG:FORMAT ${format}\n`);
    },

    getConfigFormat: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:CONFIG:FORMAT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setConfigEndian: function (channel, endian) {
      client.write(`:DECODER${channel}:CONFIG:ENDIAN ${endian}\n`);
    },

    getConfigEndian: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:CONFIG:ENDIAN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setConfigWidth: function (channel, width) {
      client.write(`:DECODER${channel}:CONFIG:WIDTH ${width}\n`);
    },

    getConfigWidth: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:CONFIG:WIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getConfigSampleRate: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:CONFIG:SRATE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  decoderUART = {
    setTX: function (channel, tx) {
      client.write(`:DECODER${channel}:UART:TX ${tx}\n`);
    },

    getTX: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:TX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRX: function (channel, rx) {
      client.write(`:DECODER${channel}:UART:RX ${rx}\n`);
    },

    getRX: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:RX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPolarity: function (channel, polarity) {
      client.write(`:DECODER${channel}:UART:POLARITY ${polarity}\n`);
    },

    getPolarity: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:POLARITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEndian: function (channel, endian) {
      client.write(`:DECODER${channel}:UART:ENDIAN ${endian}\n`);
    },

    getEndian: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:ENDIAN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBaud: function (channel, baud) {
      client.write(`:DECODER${channel}:UART:BAUD ${baud}\n`);
    },

    getBaud: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:BAUD?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWidth: function (channel, width) {
      client.write(`:DECODER${channel}:UART:WIDTH ${width}\n`);
    },

    getWidth: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:WIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setStop: function (stop_bit) {
      client.write(`:DECODER:UART:STOP ${stop_bit}\n`);
    },

    getStop: function () {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:STOP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setParity: function (channel, parity) {
      client.write(`:DECODER${channel}:UART:PARITY ${parity}\n`);
    },

    getParity: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:UART:PARITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  decoderIIC = {
    setClock: function (channel, clock) {
      client.write(`:DECODER${channel}:IIC:CLK ${clock}\n`);
    },

    getClock: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:IIC:CLK?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setData: function (channel, data) {
      client.write(`:DECODER${channel}:IIC:DATA ${data}\n`);
    },

    getData: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:IIC:DATA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAddress: function (channel, address) {
      client.write(`:DECODER${channel}:IIC:ADDRESS ${address}\n`);
    },

    getAddress: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:IIC:ADDRESS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  decoderSPI = {
    setClock: function (channel, clock) {
      client.write(`:DECODER${channel}:SPI:CLK ${clock}\n`);
    },

    getClock: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:CLK?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMISO: function (channel, miso) {
      client.write(`:DECODER${channel}:SPI:MISO ${miso}\n`);
    },

    getMISO: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:MISO?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setCS: function (channel, cs) {
      client.write(`:DECODER${channel}:SPI:CS ${cs}\n`);
    },

    getCS: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:CS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSelect: function (channel, select_polarity) {
      client.write(`:DECODER${channel}:SPI:SELECT ${select_polarity}\n`);
    },

    getSelect: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:SELECT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMode: function (channel, mode) {
      client.write(`:DECODER${channel}:SPI:MODE ${mode}\n`);
    },

    getMode: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setTimeout: function (channel, timeout) {
      client.write(`:DECODER${channel}:SPI:TIMEOUT ${timeout}\n`);
    },

    getTimeout: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:TIMEOUT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPolarity: function (channel, polarity) {
      client.write(`:DECODER${channel}:SPI:POLARITY ${polarity}\n`);
    },

    getPolarity: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:POLARITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEdge: function (channel, edge) {
      client.write(`:DECODER${channel}:SPI:EDGE ${edge}\n`);
    },

    getEdge: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:EDGE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEndian: function (channel, endian) {
      client.write(`:DECODER${channel}:SPI:ENDIAN ${endian}\n`);
    },

    getEndian: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:ENDIAN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWidth: function (channel, width) {
      client.write(`:DECODER${channel}:SPI:WIDTH ${width}\n`);
    },

    getWidth: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:SPI:WIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  decoderParallel = {
    setClock: function (channel, clock) {
      client.write(`:DECODER${channel}:PARALLEL:CLK ${clock}\n`);
    },

    getClock: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:CLK?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEdge: function (channel, edge) {
      client.write(`:DECODER${channel}:PARALLEL:EDGE ${edge}\n`);
    },

    getEdge: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:EDGE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWidth: function (channel, width) {
      client.write(`:DECODER${channel}:PARALLEL:WIDTH ${width}\n`);
    },

    getWidth: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:WIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBITX: function (channel, bitx) {
      client.write(`:DECODER${channel}:PARALLEL:BITX ${bitx}\n`);
    },

    getBITX: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:BITX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSource: function (channel, source) {
      client.write(`:DECODER${channel}:PARALLEL:SOURCE ${source}\n`);
    },

    getSource: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPolarity: function (channel, polarity) {
      client.write(`:DECODER${channel}:PARALLEL:POLARITY ${polarity}\n`);
    },

    getPolarity: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:POLARITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNoiseRejection: function (channel, noiseRejection) {
      client.write(`:DECODER${channel}:PARALLEL:NREJECT ${noiseRejection}\n`);
    },

    getNoiseRejection: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:NREJECT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNoiseRejectionTime: function (channel, noiseRejectionTime) {
      client.write(
        `:DECODER${channel}:PARALLEL:NRTIME ${noiseRejectionTime}\n`
      );
    },

    getNoiseRejectionTime: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:NRTIME?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setClockCompensation: function (channel, clockCompensation) {
      client.write(
        `:DECODER${channel}:PARALLEL:CCOMPENSATION ${clockCompensation}\n`
      );
    },

    getClockCompensation: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:CCOMPENSATION?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPlot: function (channel, plot) {
      client.write(`:DECODER${channel}:PARALLEL:PLOT ${plot}\n`);
    },

    getPlot: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:DECODER${channel}:PARALLEL:PLOT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  Display = {
    clear: function () {
      client.write(":DISPLAY:CLEAR\n");
    },

    getData: function (color, invert, format) {
      return new Promise((resolve) => {
        client.write(`:DISPLAY:DATA? ${[color, invert, format]}\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setType: function (type) {
      client.write(`:DISPLAY:TYPE ${type}\n`);
    },

    getType: function () {
      return new Promise((resolve) => {
        client.write(`:DISPLAY:TYPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setGradingTime: function (time) {
      client.write(`:DISPLAY:GRADING:TIME ${time}\n`);
    },

    getGradingTime: function () {
      return new Promise((resolve) => {
        client.write(`:DISPLAY:GRADING:TIME?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformBrightness: function (brightness) {
      client.write(`:DISPLAY:WRBRIGHTNESS ${brightness}\n`);
    },

    getWaveformBrightness: function () {
      return new Promise((resolve) => {
        client.write(`:DISPLAY:WRBRIGHTNESS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setGrid: function (grid) {
      client.write(`:DISPLAY:GRID ${grid}\n`);
    },

    getGrid: function () {
      return new Promise((resolve) => {
        client.write(`:DISPLAY:GRID?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setGridBrightness: function (brightness) {
      client.write(`:DISPLAY:GBRIGHTNESS ${brightness}\n`);
    },

    getGridBrightness: function () {
      return new Promise((resolve) => {
        client.write(`:DISPLAY:GBRIGHTNESS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  ETABLE = {
    setDisp: function (channel, disp) {
      client.write(`:ETABLE${channel}:DISP ${disp}\n`);
    },

    getDisp: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:ETABLE${channel}:DISP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFormat: function (channel, format) {
      client.write(`:ETABLE${channel}:FORMAT ${format}\n`);
    },

    getFormat: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:ETABLE${channel}:FORMAT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setView: function (channel, view) {
      client.write(`:ETABLE${channel}:VIEW ${view}\n`);
    },

    getView: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:ETABLE${channel}:VIEW?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setColumn: function (channel, column) {
      client.write(`:ETABLE${channel}:COLUMN ${column}\n`);
    },

    getColumn: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:ETABLE${channel}:COLUMN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRow: function (channel, row) {
      client.write(`:ETABLE${channel}:ROW ${row}\n`);
    },

    getRow: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:ETABLE${channel}:ROW?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSort: function (channel, sort) {
      client.write(`:ETABLE${channel}:SORT ${sort}\n`);
    },

    getSort: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:ETABLE${channel}:SORT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getData: function (channel) {
      return new Promise((resolve) => {
        if (typeof channel != "number")
          throw new Error("Channel must be a number");
        client.write(`:ETABLE${channel}:DATA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  functionCommands = {
    setEndFrameWaveformRecording: function (enable) {
      client.write(`:FUNCTION:WRECORD:FEND ${enable}\n`);
    },

    getEndFrameWaveformRecording: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:FEND?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getMaximumFrameNumberRecordable: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:FMAX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFrameInterval: function (interval) {
      client.write(`:FUNCTION:WRECORD:FINTERVAL ${interval}\n`);
    },

    getFrameInterval: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:FINTERVAL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSoundPrompt: function (enable) {
      client.write(`:FUNCTION:WRECORD:PROMPT ${enable}\n`);
    },

    getSoundPrompt: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:PROMPT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformRecordingOperate: function (enable) {
      client.write(`:FUNCTION:WRECORD:OPERATE ${enable}\n`);
    },

    getWaveformRecordingOperate: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:OPERATE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformRecordingStatus: function (enable) {
      client.write(`:FUNCTION:WRECORD:ENABLE ${enable}\n`);
    },

    getWaveformRecordingStatus: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:ENABLE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformRecordingStartFrame: function (frame) {
      client.write(`:FUNCTION:WRECORD:FSTART ${frame}\n`);
    },

    getWaveformRecordingStartFrame: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:FSTART?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformRecordingEndFrame: function (frame) {
      client.write(`:FUNCTION:WRECORD:FEND ${frame}\n`);
    },

    getWaveformRecordingEndFrame: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:FEND?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getMaximumFramesRecorded: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:FMAX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformFrameInterval: function (interval) {
      client.write(`:FUNCTION:WRECORD:FINTERVAL ${interval}\n`);
    },

    getWaveformFrameInterval: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WRECORD:FINTERVAL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformPlayback: function (enable) {
      client.write(`:FUNCTION:WREPLAY:MODE ${enable}\n`);
    },

    getWaveformPlayback: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WREPLAY:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformPlaybackDirection: function (direction) {
      client.write(`:FUNCTION:WREPLAY:DIRECTION ${direction}\n`);
    },

    getWaveformPlaybackDirection: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WREPLAY:DIRECTION?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformPlaybackOperate: function (enable) {
      client.write(`:FUNCTION:WREPLAY:OPERATE ${enable}\n`);
    },

    getWaveformPlaybackOperate: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WREPLAY:OPERATE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWaveformCurrentPlaybackFrame: function (frame) {
      client.write(`:FUNCTION:WREPLAY:FCURRENT ${frame}\n`);
    },

    getWaveformCurrentPlaybackFrame: function () {
      return new Promise((resolve) => {
        client.write(`:FUNCTION:WREPLAY:FCURRENT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  IEEE488_2 = {
    cls: function () {
      client.write(`*CLS\n`);
    },

    setESE: function (value) {
      client.write(`*ESE ${value}\n`);
    },

    getESE: function () {
      return new Promise((resolve) => {
        client.write(`*ESE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getESR: function () {
      return new Promise((resolve) => {
        client.write(`*ESR?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getIDN: function () {
      return new Promise((resolve) => {
        client.write(`*IDN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getOPC: function () {
      return new Promise((resolve) => {
        client.write(`*OPC?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    rst: function () {
      client.write(`*RST\n`);
    },

    setSRE: function (value) {
      client.write(`*SRE ${value}\n`);
    },

    getSRE: function () {
      return new Promise((resolve) => {
        client.write(`*SRE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getSTB: function () {
      return new Promise((resolve) => {
        client.write(`*STB?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getTST: function () {
      return new Promise((resolve) => {
        client.write(`*TST?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getWAI: function () {
      return new Promise((resolve) => {
        client.write(`*WAI?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  lan = {
    setDHCP: function (enable) {
      client.write(`:LAN:DHCP ${enable}\n`);
    },

    getDHCP: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:DHCP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAUTOIP: function (enable) {
      client.write(`:LAN:AUTOIP ${enable}\n`);
    },

    getAUTOIP: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:AUTOIP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setGateway: function (value) {
      client.write(`:LAN:GATEWAY ${value}\n`);
    },

    getGateway: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:GATEWAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDNS: function (value) {
      client.write(`:LAN:DNS ${value}\n`);
    },

    getDNS: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:DNS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getMAC: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:MAC?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setManual: function (value) {
      client.write(`:LAN:MANUAL ${value}\n`);
    },

    getManual: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:MANUAL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    initiate: function () {
      client.write(`:LAN:INITIATE\n`);
    },

    setIpAddress: function (value) {
      client.write(`:LAN:IPADDRESS ${value}\n`);
    },

    getIpAddress: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:IPADDRESS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSubnetMask: function (value) {
      client.write(`:LAN:SMASK ${value}\n`);
    },

    getSubnetMask: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:SMASK?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getStatus: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:STATUS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getVISA: function () {
      return new Promise((resolve) => {
        client.write(`:LAN:VISA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    apply: function () {
      client.write(`:LAN:APPLY\n`);
    },
  };

  math = {
    setDisplay: function (value) {
      client.write(`:MATH:DISPLAY ${value}\n`);
    },

    getDisplay: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:DISPLAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setOperator: function (value) {
      client.write(`:MATH:OPERATOR ${value}\n`);
    },

    getOperator: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPERATOR?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSource: function (source, channel) {
      client.write(`:MATH:SOURCE${source},${channel}\n`);
    },

    getSource: function (source) {
      return new Promise((resolve) => {
        client.write(`:MATH:SOURCE${source}?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setLogicOperationSource: function (source, channel) {
      client.write(`:MATH:LSOURCE${source},${channel}\n`);
    },

    getLogicOperationSource: function (source) {
      return new Promise((resolve) => {
        client.write(`:MATH:LSOURCE${source}?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVerticalScale: function (value) {
      client.write(`:MATH:SCALE ${value}\n`);
    },

    getVerticalScale: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:SCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setOffset: function (value) {
      client.write(`:MATH:OFFSET ${value}\n`);
    },

    getOffset: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OFFSET?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setInvert: function (value) {
      client.write(`:MATH:INVERT ${value}\n`);
    },

    getInvert: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:INVERT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    reset: function () {
      client.write(`:MATH:RESET\n`);
    },

    setFFTSource: function (channel) {
      client.write(`:MATH:FFT:SOURCE ${channel}\n`);
    },

    getFFTSource: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FFT:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFFTWindow: function (value) {
      client.write(`:MATH:FFT:WINDOW ${value}\n`);
    },

    getFFTWindow: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FFT:WINDOW?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFFTSplit: function (value) {
      client.write(`:MATH:FFT:SPLIT ${value}\n`);
    },

    getFFTSplit: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FFT:SPLIT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFFTUnit: function (value) {
      client.write(`:MATH:FFT:UNIT ${value}\n`);
    },

    getFFTUnit: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FFT:UNIT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFFTHorizontalScale: function (value) {
      client.write(`:MATH:FFT:HSCALE ${value}\n`);
    },

    getFFTHorizontalScale: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FFT:HSCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFFTHorizontalCenterFrequency: function (value) {
      client.write(`:MATH:FFT:HCENTER ${value}\n`);
    },

    getFFTHorizontalCenterFrequency: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FFT:HCENTER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFFTMode: function (value) {
      client.write(`:MATH:FFT:MODE ${value}\n`);
    },

    getFFTMode: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FFT:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFilterType: function (value) {
      client.write(`:MATH:FILTER:TYPE ${value}\n`);
    },

    getFilterType: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FILTER:TYPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFilterW1: function (value) {
      client.write(`:MATH:FILTER:W1 ${value}\n`);
    },

    getFilterW1: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FILTER:W1?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFilterW2: function (value) {
      client.write(`:MATH:FILTER:W2 ${value}\n`);
    },

    getFilterW2: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:FILTER:W2?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setStartPoint: function (value) {
      client.write(`:MATH:OPTION:START ${value}\n`);
    },

    getStartPoint: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:START?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEndPoint: function (value) {
      client.write(`:MATH:OPTION:END ${value}\n`);
    },

    getEndPoint: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:END?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setInvert: function (value) {
      client.write(`:MATH:OPTION:INVERT ${value}\n`);
    },

    getInvert: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:INVERT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSensitivity: function (value) {
      client.write(`:MATH:OPTION:SENSITIVITY ${value}\n`);
    },

    getSensitivity: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:SENSITIVITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDistance: function (value) {
      client.write(`:MATH:OPTION:DISTANCE ${value}\n`);
    },

    getDistance: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:DISTANCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAutoScale: function (value) {
      client.write(`:MATH:OPTION:ASCALE ${value}\n`);
    },

    getAutoScale: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:ASCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setThreshold: function (channel, value) {
      client.write(`:MATH:OPTION:THRESHOLD:${channel} ${value}\n`);
    },

    getThreshold: function (channel) {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:THRESHOLD:${channel}?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFXSource: function (source, channel) {
      client.write(`:MATH:OPTION:FX:SOURCE ${source} ${channel}\n`);
    },

    getFXSource: function (channel) {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:FX:SOURCE? ${channel}\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFXOperator: function (operator) {
      client.write(`:MATH:OPTION:FX:OPERATOR ${operator}\n`);
    },

    getFXOperator: function () {
      return new Promise((resolve) => {
        client.write(`:MATH:OPTION:FX:OPERATOR?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  mask = {
    setEnable: function (value) {
      client.write(`:MASK:ENABLE ${value}\n`);
    },

    getEnable: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:ENABLE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSource: function (value) {
      client.write(`:MASK:SOURCE ${value}\n`);
    },

    getSource: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setOperate: function (value) {
      client.write(`:MASK:OPERATE ${value}\n`);
    },

    getOperate: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:OPERATE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMDisplay: function (value) {
      client.write(`:MASK:MDISPLAY ${value}\n`);
    },

    getMDisplay: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:MDISPLAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setStopOnFail: function (value) {
      client.write(`:MASK:SOOUTPUT ${value}\n`);
    },

    getStopOnFail: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:SOOUTPUT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSoundOutput: function (value) {
      client.write(`:MASK:OUTPUT ${value}\n`);
    },

    getSoundOutput: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:OUTPUT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setX: function (value) {
      client.write(`:MASK:X ${value}\n`);
    },

    getX: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:X?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setY: function (value) {
      client.write(`:MASK:Y ${value}\n`);
    },

    getY: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:Y?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    create: function () {
      client.write(`:MASK:CREATE\n`);
    },

    passed: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:PASSED?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    failed: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:FAILED?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    total: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:TOTAL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    reset: function () {
      return new Promise((resolve) => {
        client.write(`:MASK:RESET\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  measure = {
    setSource: function (value) {
      client.write(`:MEASURE:SOURCE ${value}\n`);
    },

    getSource: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setCounterSource: function (value) {
      client.write(`:MEASURE:COUNTER:SOURCE ${value}\n`);
    },

    getCounterSource: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:COUNTER:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getCounterValue: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:COUNTER:VALUE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    clear: function (item) {
      client.write(`:MEASURE:CLEAR ${item}\n`);
    },

    recover: function (item) {
      client.write(`:MEASURE:RECOVER ${item}\n`);
    },

    setADisplay: function (value) {
      client.write(`:MEASURE:ADISPLAY ${value}\n`);
    },

    getADisplay: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:ADISPLAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setAMSource: function (value) {
      client.write(`:MEASURE:AMSOURCE ${value}\n`);
    },

    getAMSource: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:AMSOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMax: function (value) {
      client.write(`:MEASURE:SETUP:MAX ${value}\n`);
    },

    getMax: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SETUP:MAX?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMid: function (value) {
      client.write(`:MEASURE:SETUP:MID ${value}\n`);
    },

    getMid: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SETUP:MID?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMin: function (value) {
      client.write(`:MEASURE:SETUP:MIN ${value}\n`);
    },

    getMin: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SETUP:MIN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPSA: function (value) {
      client.write(`:MEASURE:SETUP:PSA ${value}\n`);
    },

    getPSA: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SETUP:PSA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPSB: function (value) {
      client.write(`:MEASURE:SETUP:PSB ${value}\n`);
    },

    getPSB: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SETUP:PSB?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDSA: function (value) {
      client.write(`:MEASURE:SETUP:DSA ${value}\n`);
    },

    getDSA: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SETUP:DSA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDSB: function (value) {
      client.write(`:MEASURE:SETUP:DSB ${value}\n`);
    },

    getDSB: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:SETUP:DSB?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setStatisticDisplay: function (value) {
      client.write(`:MEASURE:STATISTIC:DISPLAY ${value}\n`);
    },

    getStatisticDisplay: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:STATISTIC:DISPLAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setStatisticMode: function (value) {
      client.write(`:MEASURE:STATISTIC:MODE ${value}\n`);
    },

    getStatisticMode: function () {
      return new Promise((resolve) => {
        client.write(`:MEASURE:STATISTIC:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    statisticReset: function () {
      client.write(`:MEASURE:STATISTIC:RESET\n`);
    },

    setStatisticItem: function (item, source) {
      client.write(`:MEASURE:STATISTIC:ITEM ${item} ${source}\n`);
    },

    getStatisticItem: function (item, source) {
      return new Promise((resolve) => {
        client.write(`:MEASURE:STATISTIC:ITEM? ${item} ${source}\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMeasureItem: function (item, source) {
      client.write(`:MEASURE:ITEM ${item} ${source}\n`);
    },

    getMeasureItem: function (item) {
      return new Promise((resolve) => {
        client.write(`:MEASURE:ITEM? ${item}\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  reference = {
    setDisplay: function (value) {
      client.write(`:REFERENCE:DISPLAY ${value}\n`);
    },

    getDisplay: function () {
      return new Promise((resolve) => {
        client.write(`:REFERENCE:DISPLAY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEnable: function (channel, value) {
      client.write(`:REFERENCE${channel}:ENABLE ${value}\n`);
    },

    getEnable: function (channel) {
      return new Promise((resolve) => {
        client.write(`:REFERENCE${channel}:ENABLE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSource: function (channel, value) {
      client.write(`:REFERENCE${channel}:SOURCE ${value}\n`);
    },

    getSource: function (channel) {
      return new Promise((resolve) => {
        client.write(`:REFERENCE${channel}:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVerticalScale: function (channel, value) {
      client.write(`:REFERENCE${channel}:VSCALE ${value}\n`);
    },

    getVerticalScale: function (channel) {
      return new Promise((resolve) => {
        client.write(`:REFERENCE${channel}:VSCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVerticalOffset: function (channel, value) {
      client.write(`:REFERENCE${channel}:VOFFSET ${value}\n`);
    },

    getVerticalOffset: function (channel) {
      return new Promise((resolve) => {
        client.write(`:REFERENCE${channel}:VOFFSET?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    reset: function (channel) {
      client.write(`:REFERENCE${channel}:RESET\n`);
    },

    current: function (channel) {
      client.write(`:REFERENCE${channel}:CURRENT\n`);
    },

    save: function (channel) {
      client.write(`:REFERENCE${channel}:SAVE\n`);
    },

    setColor: function (channel, value) {
      client.write(`:REFERENCE${channel}:COLOR ${value}\n`);
    },

    getColor: function (channel) {
      return new Promise((resolve) => {
        client.write(`:REFERENCE${channel}:COLOR?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  storage = {
    setImageType: function (value) {
      client.write(`:STORAGE:IMAGE:TYPE ${value}\n`);
    },

    getImageType: function () {
      return new Promise((resolve) => {
        client.write(`:STORAGE:IMAGE:TYPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setImageInvert: function (value) {
      client.write(`:STORAGE:IMAGE:INVERT ${value}\n`);
    },

    getImageInvert: function () {
      return new Promise((resolve) => {
        client.write(`:STORAGE:IMAGE:INVERT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setImageColor: function (value) {
      client.write(`:STORAGE:IMAGE:COLOR ${value}\n`);
    },

    getImageColor: function () {
      return new Promise((resolve) => {
        client.write(`:STORAGE:IMAGE:COLOR?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  system = {
    setAutoScale: function (value) {
      client.write(`:SYSTEM:AUTOSCALE ${value}\n`);
    },

    getAutoScale: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:AUTOSCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setBeeper: function (value) {
      client.write(`:SYSTEM:BEEPER ${value}\n`);
    },

    getBeeper: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:BEEPER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    queryAndDeleteError: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:ERROR:NEXT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getGAM: function (value) {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:GAM?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setLanguage: function (value) {
      client.write(`:SYSTEM:LANGUAGE ${value}\n`);
    },

    getLanguage: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:LANGUAGE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setLock: function (value) {
      client.write(`:SYSTEM:LOCKED ${value}\n`);
    },

    getLock: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:LOCKED?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPON: function (value) {
      client.write(`:SYSTEM:PON ${value}\n`);
    },

    getPON: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:PON?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    install: function (key) {
      client.write(`:SYSTEM:OPTION:INSTALL ${key}\n`);
    },

    uninstall: function () {
      client.write(`:SYSTEM:OPTION:UNINSTALL\n`);
    },

    getRAM: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:RAM?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSetup: function (value) {
      client.write(`:SYSTEM:SETUP ${value}\n`);
    },

    getSetup: function () {
      return new Promise((resolve) => {
        client.write(`:SYSTEM:SETUP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  timebase = {
    setDelayEnable: function (value) {
      client.write(`:TIMEBASE:DELAY:ENABLE ${value}\n`);
    },

    getDelayEnable: function () {
      return new Promise((resolve) => {
        client.write(`:TIMEBASE:DELAY:ENABLE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDelayOffset: function (value) {
      client.write(`:TIMEBASE:DELAY:OFFSET ${value}\n`);
    },

    getDelayOffset: function () {
      return new Promise((resolve) => {
        client.write(`:TIMEBASE:DELAY:OFFSET?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDelayScale: function (value) {
      client.write(`:TIMEBASE:DELAY:SCALE ${value}\n`);
    },

    getDelayScale: function () {
      return new Promise((resolve) => {
        client.write(`:TIMEBASE:DELAY:SCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMainOffset: function (value) {
      client.write(`:TIMEBASE:MAIN:OFFSET ${value}\n`);
    },

    getMainOffset: function () {
      return new Promise((resolve) => {
        client.write(`:TIMEBASE:MAIN:OFFSET?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMainScale: function (value) {
      client.write(`:TIMEBASE:MAIN:SCALE ${value}\n`);
    },

    getMainScale: function () {
      return new Promise((resolve) => {
        client.write(`:TIMEBASE:MAIN:SCALE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMode: function (value) {
      client.write(`:TIMEBASE:MODE ${value}\n`);
    },

    getMode: function () {
      return new Promise((resolve) => {
        client.write(`:TIMEBASE:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  trigger = {

    single: function () {
      client.write(":SINGlE\n");
    },

    force: function () {
      client.write(":TFORCE\n");
    },

    setMode: function (value) {
      client.write(`:TRIGGER:MODE ${value}\n`);
    },

    getMode: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setCoupling: function (value) {
      client.write(`:TRIGGER:COUPLING ${value}\n`);
    },

    getCoupling: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:COUPLING?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getStatus: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:STATUS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSweep: function (value) {
      client.write(`:TRIGGER:SWEEP ${value}\n`);
    },

    getSweep: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SWEEP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setHoldOff: function (value) {
      client.write(`:TRIGGER:HOLDOFF ${value}\n`);
    },

    getHoldOff: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:HOLDOFF?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNoiseRejection: function (value) {
      client.write(`:TRIGGER:NREJECT ${value}\n`);
    },

    getNoiseRejection: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:NREJECT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getPosition: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:POSITION?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEdgeSource: function (channel) {
      client.write(`:TRIGGER:EDGE:SOURCE ${channel}\n`);
    },

    getEdgeSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:EDGE:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEdgeSlope: function (value) {
      client.write(`:TRIGGER:EDGE:SLOPE ${value}\n`);
    },

    getEdgeSlope: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:EDGE:SLOPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setEdgeLevel: function (value) {
      client.write(`:TRIGGER:EDGE:LEVEL ${value}\n`);
    },

    getEdgeLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:EDGE:LEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPulseSource: function (channel) {
      client.write(`:TRIGGER:PULSE:SOURCE ${channel}\n`);
    },

    getPulseSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PULSE:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPulseWhen: function (value) {
      client.write(`:TRIGGER:PULSE:WHEN ${value}\n`);
    },

    getPulseWhen: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PULSE:WHEN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPulseWidth: function (value) {
      client.write(`:TRIGGER:PULSE:WIDTH ${value}\n`);
    },

    getPulseWidth: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PULSE:WIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setUpperPulseWidth: function (value) {
      client.write(`:TRIGGER:PULSE:UWIDTH ${value}\n`);
    },

    getUpperPulseWidth: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PULSE:UWIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setLowerPulseWidth: function (value) {
      client.write(`:TRIGGER:PULSE:LWIDTH ${value}\n`);
    },

    getLowerPulseWidth: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PULSE:LWIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPulseLevel: function (value) {
      client.write(`:TRIGGER:PULSE:LEVEL ${value}\n`);
    },

    getPulseLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PULSE:LEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeSource: function (channel) {
      client.write(`:TRIGGER:SLOPE:SOURCE ${channel}\n`);
    },

    getSlopeSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeWhen: function (value) {
      client.write(`:TRIGGER:SLOPE:WHEN ${value}\n`);
    },

    getSlopeWhen: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:WHEN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeTime: function (value) {
      client.write(`:TRIGGER:SLOPE:TIME ${value}\n`);
    },

    getSlopeTime: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:TIME?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeUpperLimitTime: function (value) {
      client.write(`:TRIGGER:SLOPE:TUPPER ${value}\n`);
    },

    getSlopeUpperLimitTime: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:TUPPER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeLowerLimitTime: function (value) {
      client.write(`:TRIGGER:SLOPE:TLOWER ${value}\n`);
    },

    getSlopeLowerLimitTime: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:TLOWER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeWindows: function (value) {
      client.write(`:TRIGGER:SLOPE:WINDOW ${value}\n`);
    },

    getSlopeWindows: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:WINDOW?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeUpperLevel: function (value) {
      client.write(`:TRIGGER:SLOPE:ALEVEL ${value}\n`);
    },

    getSlopeUpperLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:ALEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSlopeLowerLevel: function (value) {
      client.write(`:TRIGGER:SLOPE:BLEVEL ${value}\n`);
    },

    getSlopeLowerLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SLOPE:BLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVideoSource: function (channel) {
      client.write(`:TRIGGER:VIDEO:SOURCE ${channel}\n`);
    },

    getVideoSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:VIDEO:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVideoPolarity: function (value) {
      client.write(`:TRIGGER:VIDEO:POLARITY ${value}\n`);
    },

    getVideoPolarity: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:VIDEO:POLARITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVideoMode: function (value) {
      client.write(`:TRIGGER:VIDEO:MODE ${value}\n`);
    },

    getVideoMode: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:VIDEO:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVideoLine: function (value) {
      client.write(`:TRIGGER:VIDEO:LINE ${value}\n`);
    },

    getVideoLine: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:VIDEO:LINE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVideoStandard: function (value) {
      client.write(`:TRIGGER:VIDEO:STANDARD ${value}\n`);
    },

    getVideoStandard: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:VIDEO:STANDARD?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setVideoLevel: function (value) {
      client.write(`:TRIGGER:VIDEO:LEVEL ${value}\n`);
    },

    getVideoLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:VIDEO:LEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPattern: function (value) {
      client.write(`:TRIGGER:PATTERN:PATTERN ${value}\n`);
    },

    getPattern: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PATTERN:PATTERN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setPatternLevel: function (channel, value) {
      client.write(`:TRIGGER:PATTERN:LEVEL ${channel},${value}\n`);
    },

    getPatternLevel: function (channel) {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:PATTERN:LEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDurationSource: function (value) {
      client.write(`:TRIGGER:DURATION:SOURCE ${value}\n`);
    },

    getDurationSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DURATION:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDurationType: function (value) {
      client.write(`:TRIGGER:DURATION:TYPE ${value}\n`);
    },

    getDurationType: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DURATION:TYPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDurationWhen: function (value) {
      client.write(`:TRIGGER:DURATION:WHEN ${value}\n`);
    },

    getDurationWhen: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DURATION:WHEN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setUpperDurationLimit: function (value) {
      client.write(`:TRIGGER:DURATION:TUPPER ${value}\n`);
    },

    getUpperDurationLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DURATION:TUPPER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setLowerDurationLimit: function (value) {
      client.write(`:TRIGGER:DURATION:TLOWER ${value}\n`);
    },

    getLowerDurationLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DURATION:TLOWER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setTimeout: function (value) {
      client.write(`:TRIGGER:TIMEOUT:SOURCE ${value}\n`);
    },

    getTimeout: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:TIMEOUT:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setTimeoutSlope: function (value) {
      client.write(`:TRIGGER:TIMEOUT:SLOPE ${value}\n`);
    },

    getTimeoutSlope: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:TIMEOUT:SLOPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setTimeoutTime: function (value) {
      client.write(`:TRIGGER:TIMEOUT:TIME ${value}\n`);
    },

    getTimeoutTime: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:TIMEOUT:TIME?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRuntSource: function (value) {
      client.write(`:TRIGGER:RUNT:SOURCE ${value}\n`);
    },

    getRuntSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RUNT:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRuntPolarity: function (value) {
      client.write(`:TRIGGER:RUNT:POLARITY ${value}\n`);
    },

    getRuntPolarity: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RUNT:POLARITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRuntWhen: function (value) {
      client.write(`:TRIGGER:RUNT:WHEN ${value}\n`);
    },

    getRuntWhen: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RUNT:WHEN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRuntPulseWidthUpperLimit: function (value) {
      client.write(`:TRIGGER:RUNT:WUPPER ${value}\n`);
    },

    getRuntPulseWidthUpperLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RUNT:WUPPER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRuntPulseWidthLowerLimit: function (value) {
      client.write(`:TRIGGER:RUNT:WLOWER ${value}\n`);
    },

    getRuntPulseWidthLowerLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RUNT:WLOWER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRuntAmplitudeUpperLimit: function (value) {
      client.write(`:TRIGGER:RUNT:ALEVEL ${value}\n`);
    },

    getRuntAmplitudeUpperLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RUNT:ALEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRuntAmplitudeLowerLimit: function (value) {
      client.write(`:TRIGGER:RUNT:BLEVEL ${value}\n`);
    },

    getRuntAmplitudeLowerLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RUNT:BLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWindowsSource: function (value) {
      client.write(`:TRIGGER:WINDOWS:SOURCE ${value}\n`);
    },

    getWindowsSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:WINDOWS:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWindowsSlope: function (value) {
      client.write(`:TRIGGER:WINDOWS:SLOPE ${value}\n`);
    },

    getWindowsSlope: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:WINDOWS:SLOPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWindowsPosition: function (value) {
      client.write(`:TRIGGER:WINDOWS:POSITION ${value}\n`);
    },

    getWindowsPosition: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:WINDOWS:POSITION?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWindowsTime: function (value) {
      client.write(`:TRIGGER:WINDOWS:TIME ${value}\n`);
    },

    getWindowsTime: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:WINDOWS:TIME?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWindowsAmplitudeUpperLimit: function (value) {
      client.write(`:TRIGGER:WINDOWS:ALEVEL ${value}\n`);
    },

    getWindowsAmplitudeUpperLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:WINDOWS:ALEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setWindowsAmplitudeLowerLimit: function (value) {
      client.write(`:TRIGGER:WINDOWS:BLEVEL ${value}\n`);
    },

    getWindowsAmplitudeLowerLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:WINDOWS:BLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDelaySource: function (source, channel) {
      client.write(`:TRIGGER:DELAY:S${source} ${channel}\n`);
    },

    getDelaySource: function (source) {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DELAY:S${source}?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDelaySlope: function (source, channel) {
      client.write(`:TRIGGER:DELAY:SLOP${source} ${channel}\n`);
    },

    getDelaySlope: function (source) {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DELAY:SLOP${source}?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDelayType: function (type) {
      client.write(`:TRIGGER:DELAY:TYPE ${type}\n`);
    },

    getDelayType: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DELAY:TYPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDelayTimeUpperLimit: function (value) {
      client.write(`:TRIGGER:DELAY:TUPPER ${value}\n`);
    },

    getDelayTimeUpperLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DELAY:TUPPER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setDelayTimeLowerLimit: function (value) {
      client.write(`:TRIGGER:DELAY:TLOWER ${value}\n`);
    },

    getDelayTimeLowerLimit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:DELAY:TLOWER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSHoldDataSource: function (source) {
      client.write(`:TRIGGER:SHOLD:DSRC ${source}\n`);
    },

    getSHoldDataSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SHOLD:DSRC?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSHoldClockSource: function (source) {
      client.write(`:TRIGGER:SHOLD:CSRC ${source}\n`);
    },

    getSHoldClockSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SHOLD:CSRC?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSHoldSlope: function (slope) {
      client.write(`:TRIGGER:SHOLD:SLOPE ${slope}\n`);
    },

    getSHoldSlope: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SHOLD:SLOPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSHoldPattern: function (pattern) {
      client.write(`:TRIGGER:SHOLD:PATTERN ${pattern}\n`);
    },

    getSHoldPattern: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SHOLD:PATTERN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSHoldType: function (type) {
      client.write(`:TRIGGER:SHOLD:TYPE ${type}\n`);
    },

    getSHoldType: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SHOLD:TYPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSHoldSetupTime: function (value) {
      client.write(`:TRIGGER:SHOLD:STIME ${value}\n`);
    },

    getSHoldSetupTime: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SHOLD:STIME?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSHoldHoldTime: function (value) {
      client.write(`:TRIGGER:SHOLD:HTIME ${value}\n`);
    },

    getSHoldHoldTime: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SHOLD:HTIME?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNEdgeSource: function (source) {
      client.write(`:TRIGGER:NEDGE:SOURCE ${source}\n`);
    },

    getNEdgeSource: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:NEDGE:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNEdgeSlope: function (slope) {
      client.write(`:TRIGGER:NEDGE:SLOPE ${slope}\n`);
    },

    getNEdgeSlope: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:NEDGE:SLOPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNEdgeIdle: function (value) {
      client.write(`:TRIGGER:NEDGE:IDLE ${value}\n`);
    },

    getNEdgeIdle: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:NEDGE:IDLE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNEdgeEdge: function (value) {
      client.write(`:TRIGGER:NEDGE:EDGE ${value}\n`);
    },

    getNEdgeEdge: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:NEDGE:EDGE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setNEdgeLevel: function (value) {
      client.write(`:TRIGGER:NEDGE:LEVEL ${value}\n`);
    },

    getNEdgeLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:NEDGE:LEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232Source: function (source) {
      client.write(`:TRIGGER:RS232:SOURCE ${source}\n`);
    },

    getRS232Source: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232When: function (when) {
      client.write(`:TRIGGER:RS232:WHEN ${when}\n`);
    },

    getRS232When: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:WHEN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232Parity: function (parity) {
      client.write(`:TRIGGER:RS232:PARITY ${parity}\n`);
    },

    getRS232Parity: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:PARITY?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232StopBit: function (stop) {
      client.write(`:TRIGGER:RS232:STOP ${stop}\n`);
    },

    getRS232StopBit: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:STOP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232Data: function (data) {
      client.write(`:TRIGGER:RS232:DATA ${data}\n`);
    },

    getRS232Data: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:DATA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232Width: function (width) {
      client.write(`:TRIGGER:RS232:WIDTH ${width}\n`);
    },

    getRS232Width: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:WIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232Baud: function (baud) {
      client.write(`:TRIGGER:RS232:BAUD ${baud}\n`);
    },

    getRS232Baud: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:BAUD?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232BaudUser: function (baud) {
      client.write(`:TRIGGER:RS232:BUSER ${baud}\n`);
    },

    getRS232BaudUser: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:BUSER?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setRS232Level: function (level) {
      client.write(`:TRIGGER:RS232:LEVEL ${level}\n`);
    },

    getRS232Level: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:RS232:LEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_SCL: function (value) {
      client.write(`:TRIGGER:IIC:SCL ${value}\n`);
    },

    getIIC_SCL: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:SCL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_SDA: function (value) {
      client.write(`:TRIGGER:IIC:SDA ${value}\n`);
    },

    getIIC_SDA: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:SDA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_When: function (value) {
      client.write(`:TRIGGER:IIC:WHEN ${value}\n`);
    },

    getIIC_When: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:WHEN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_AddressBits: function (value) {
      client.write(`:TRIGGER:IIC:AWIDTH ${value}\n`);
    },

    getIIC_AddressBits: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:AWIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_Address: function (value) {
      client.write(`:TRIGGER:IIC:ADDRESS ${value}\n`);
    },

    getIIC_Address: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:ADDRESS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_Directiom: function (value) {
      client.write(`:TRIGGER:IIC:DIRECTION ${value}\n`);
    },

    getIIC_Directiom: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:DIRECTION?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_Data: function (value) {
      client.write(`:TRIGGER:IIC:DATA ${value}\n`);
    },

    getIIC_Data: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:DATA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_SCLAmplitudeLevel: function (value) {
      client.write(`:TRIGGER:IIC:CLEVEL ${value}\n`);
    },

    getIIC_SCLAmplitudeLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:CLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setIIC_SDAAmplitudeLevel: function (value) {
      client.write(`:TRIGGER:IIC:DLEVEL ${value}\n`);
    },

    getIIC_SDAAmplitudeLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:IIC:DLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_SCL: function (value) {
      client.write(`:TRIGGER:SPI:SCL ${value}\n`);
    },

    getSPI_SCL: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:SCL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_SDA: function (value) {
      client.write(`:TRIGGER:SPI:SDA ${value}\n`);
    },

    getSPI_SDA: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:SDA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_When: function (value) {
      client.write(`:TRIGGER:SPI:WHEN ${value}\n`);
    },

    getSPI_When: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:WHEN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_Width: function (value) {
      client.write(`:TRIGGER:SPI:WIDTH ${value}\n`);
    },

    getSPI_Width: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:WIDTH?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_Data: function (value) {
      client.write(`:TRIGGER:SPI:DATA ${value}\n`);
    },

    getSPI_Data: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:DATA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_Timeout: function (value) {
      client.write(`:TRIGGER:SPI:TIMEOUT ${value}\n`);
    },

    getSPI_Timeout: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:TIMEOUT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_Slope: function (value) {
      client.write(`:TRIGGER:SPI:SLOPE ${value}\n`);
    },

    getSPI_Slope: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:SLOPE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_SCLAmplitudeLevel: function (value) {
      client.write(`:TRIGGER:SPI:CLEVEL ${value}\n`);
    },

    getSPI_SCLAmplitudeLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:CLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_SDAAmplitudeLevel: function (value) {
      client.write(`:TRIGGER:SPI:DLEVEL ${value}\n`);
    },

    getSPI_SDAAmplitudeLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:DLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getSPI_CSAmplitudeLevel: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:SLEVEL?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_CSAmplitudeLevel: function (value) {
      client.write(`:TRIGGER:SPI:SLEVEL ${value}\n`);
    },

    setSPI_Mode: function (value) {
      client.write(`:TRIGGER:SPI:MODE ${value}\n`);
    },

    getSPI_Mode: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setSPI_CS: function (value) {
      client.write(`:TRIGGER:SPI:CS ${value}\n`);
    },

    getSPI_CS: function () {
      return new Promise((resolve) => {
        client.write(`:TRIGGER:SPI:CS?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };

  waveform = {
    setSource: function (value) {
      client.write(`:WAVEFORM:SOURCE ${value}\n`);
    },

    getSource: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:SOURCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setMode: function (value) {
      client.write(`:WAVEFORM:MODE ${value}\n`);
    },

    getMode: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:MODE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setFormat: function (value) {
      client.write(`:WAVEFORM:FORMAT ${value}\n`);
    },

    getFormat: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:FORMAT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getData: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:DATA?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setXINCrement: function (value) {
      client.write(`:WAVEFORM:XINCREMENT ${value}\n`);
    },

    getXINCrement: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:XINCREMENT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setXORigin: function (value) {
      client.write(`:WAVEFORM:XORIGIN ${value}\n`);
    },

    getXORigin: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:XORIGIN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setXReference: function (value) {
      client.write(`:WAVEFORM:XREFERENCE ${value}\n`);
    },

    getXReference: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:XREFERENCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setYIncrement: function (value) {
      client.write(`:WAVEFORM:YINCREMENT ${value}\n`);
    },

    getYIncrement: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:YINCREMENT?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setYOrigin: function (value) {
      client.write(`:WAVEFORM:YORIGIN ${value}\n`);
    },

    getYOrigin: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:YORIGIN?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setYReference: function (value) {
      client.write(`:WAVEFORM:YREFERENCE ${value}\n`);
    },

    getYReference: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:YREFERENCE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setStart: function (value) {
      client.write(`:WAVEFORM:START ${value}\n`);
    },

    getStart: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:START?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    setStop: function (value) {
      client.write(`:WAVEFORM:STOP ${value}\n`);
    },

    getStop: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:STOP?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },

    getPreamble: function () {
      return new Promise((resolve) => {
        client.write(`:WAVEFORM:PREAMBLE?\n`);
        client.on("data", (data) => {
          resolve(data.toString());
        });
      });
    },
  };
}

module.exports.RigolConnector = RigolConnector;
