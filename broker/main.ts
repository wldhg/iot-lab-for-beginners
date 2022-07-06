import net from 'net';
import pino, { P } from 'pino';
import axios from 'axios';

const port = 8080;
const apiPort = 3000;

const log = pino();
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

net.createServer((sock) => {
  const clientID = `${sock.remoteAddress}:${sock.remotePort}`;
  log.info(`+ [${clientID}] connected`);
  sock.on('data', (data) => {
    data.toString().split(vegimiteMagicCode).forEach((line) => {
      if (line.length > 0) {
        log.debug(`>I [${sock.remoteAddress}:${sock.remotePort}] ${line}`);
        let parsedLine: any = {};
        try {
          parsedLine = JSON.parse(line);
        } catch (e) {
          log.error(`>I [${sock.remoteAddress}:${sock.remotePort}] ${e}`);
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
                  log.info(`<O [${sock.remoteAddress}:${sock.remotePort}] ${JSON.stringify(returnObject)}`);
                  sock.write(`${JSON.stringify(returnObject)}${vegimiteMagicCode}`);
                }).catch(log.error.bind(log));
              },
              subReqInterval,
            ),
            actCode: subReqAction,
          };
        } else {
          for (const [key, value] of Object.entries(parsedLine)) {
            const nValue = Number.parseFloat(value as string);
            log.info(`I> [${sock.remoteAddress}:${sock.remotePort}] ${key}=${nValue} (${value})`);
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
  });
  sock.on('close', () => {
    log.info(`- [${clientID}] disconnected`);
    if (clientID in subscribers) {
      for (const [key, value] of Object.entries(subscribers[clientID])) {
        clearInterval(value.intCode);
        delete subscribers[clientID][key];
      }
      delete subscribers[clientID];
    }
  });
  sock.on('error', (err) => {
    log.error(`[${clientID}] error: ${err}`);
  });
}).listen(port, '0.0.0.0', () => {
  log.info(`TCP server listening on port ${port}`);
});
