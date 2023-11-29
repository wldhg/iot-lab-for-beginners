import { DelimiterParser } from '@serialport/parser-delimiter';
import axios from 'axios';
import fsp from 'fs/promises';
import pino from 'pino';
import { SerialPort } from 'serialport';

const apiPort = 3000;

const log = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
const subReqMagicCode = 'VEGEMITE_SPECIAL_CMD_SUBSCRIBE';
const subIntMagicCode = 'VEGEMITE_SPECIAL_CMD_SUBSCRIBE_INTERVAL';
const subActMagicCode = 'VEGEMITE_SPECIAL_CMD_SUBSCRIBE_ACTION';
const vegimiteMagicCode = String.fromCharCode(0x16, 0x0d, 0x0a);

const subscribers: {
  [key: string]: {
    [key: string]: {
      intCode: NodeJS.Timeout;
      actCode: string;
    };
  }
} = {};

fsp.readdir('/dev').then((files) => {
  const ttyUSB = files.find((file) => file.startsWith('ttyUSB'));
  if (ttyUSB) {
    log.info(`Found ttyUSB: ${ttyUSB}`);
    return new SerialPort({
      path: `/dev/${ttyUSB}`,
      baudRate: 250000,
    });
  }
  throw new Error('No ttyUSB found');
}).then((port) => {
  const parser = new DelimiterParser({ delimiter: vegimiteMagicCode });
  const clientID = port.path;

  parser.on('data', (line) => {
    if (line.length > 0) {
      log.debug(`>I ${line}`);
      let parsedLine: any = {};
      try {
        parsedLine = JSON.parse(line);
      } catch (e) {
        log.error(`>I ${e}`);
        return;
      }
      if (line.indexOf(subReqMagicCode) >= 0) {
        if (!(clientID in subscribers)) {
          subscribers[clientID] = {};
        }
        const subReq = parsedLine;
        const subReqDataID = subReq[subReqMagicCode] as string;
        const subReqAction = (subReq[subActMagicCode] || '__unknown') as string;
        const subReqInterval = subReq[subIntMagicCode] as number;
        if (subReqDataID in subscribers[clientID]) {
          clearInterval(subscribers[clientID][subReqDataID].intCode);
          delete subscribers[clientID][subReqDataID];
        }
        subscribers[clientID][subReqDataID] = {
          intCode: setInterval(
            () => {
              axios.get(`http://localhost:${apiPort}/api/load`, {
                headers: {
                  'query-key': subReqDataID,
                  'query-count': 1,
                  'query-action': subReqAction,
                },
              }).then((res) => {
                const returnObject: {
                  [key: string]: number;
                } = {};
                returnObject[subReqDataID] = 0;
                if (res.data?.code === 0) {
                  if (res.data?.data?.length >= 1) {
                    const resData = res.data.data;
                    if (resData[0][1].length >= 1) {
                      returnObject[subReqDataID] = resData[0][1][0][1] as number;
                    }
                  }
                }
                log.info(`<O ${JSON.stringify(returnObject)}`);
                port.write(`${JSON.stringify(returnObject)}${vegimiteMagicCode}`);
              }).catch(log.error.bind(log));
            },
            subReqInterval,
          ),
          actCode: subReqAction,
        };
      } else {
        for (const [key, value] of Object.entries(parsedLine)) {
          const nValue = Number.parseFloat(value as string);
          log.info(`I> ${key}=${nValue} (${value})`);
          if (!Number.isNaN(nValue)) {
            axios({
              method: 'post',
              url: `http://localhost:${apiPort}/api/save`,
              headers: {
                'Content-Type': 'text/plain',
              },
              data: `${key}=${nValue}`,
            }).catch(log.error.bind(log));
          }
        }
      }
    }
  });

  parser.on('close', () => {
    log.info(`- [${clientID}] disconnected`);
    if (clientID in subscribers) {
      for (const [key, value] of Object.entries(subscribers[clientID])) {
        clearInterval(value.intCode);
        delete subscribers[clientID][key];
      }
      delete subscribers[clientID];
    }
  });

  parser.on('error', (err) => {
    log.error(`[${clientID}] error: ${err}`);
  });

  port.pipe(parser);

  log.info(`Serial port listening on device ${port.path}`);
}).catch((err) => {
  log.error(err);
});
