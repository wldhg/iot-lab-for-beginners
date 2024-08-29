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
  level: 'debug',
});
const reqTypeKey = '_VGMT';
const reqDataKey = '_VGMT_K';
const reqDataValue = '_VGMT_V';
const vegimiteMagicCodeS = '_VGMT_S_';
const vegimiteMagicCodeE = '_VGMT_E_';

fsp
  .readdir('/dev')
  .then((files) => {
    const ttyUSB = files.find((file) => file.startsWith('ttyUSB') || file.startsWith('cu.usbmodem'));
    if (ttyUSB) {
      log.info(`Found ttyUSB: ${ttyUSB}`);
      return new SerialPort({
        path: `/dev/${ttyUSB}`,
        baudRate: 9600,
      });
    }
    throw new Error('No ttyUSB found');
  })
  .then((port) => {
    const parser = new DelimiterParser({ delimiter: vegimiteMagicCodeS });
    const clientID = port.path;

    parser.on('data', (line) => {
      if (line.length > 0) {
        log.debug(`>I ${line}`);
        let parsedLine: Record<string, any> = {};
        try {
          parsedLine = JSON.parse(String(line).trim());
        } catch (e) {
          log.error(`>I ${e}`);
          log.error(
            `>I ${line}`,
          );
          return;
        }
        if (reqTypeKey in parsedLine) {
          if (parsedLine[reqTypeKey] === 'PUT') {
            const key = parsedLine[reqDataKey];
            const value = parsedLine[reqDataValue];
            const nValue = Number.parseFloat(value as string);
            log.info(
              `I> ${key}=${nValue} (${value})`,
            );
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
          } else if (parsedLine[reqTypeKey].startsWith('GET')) {
            const hasAction = parsedLine[reqTypeKey].split('+').length >= 2;
            const action = hasAction ? parsedLine[reqTypeKey].split('+')[1] : '';
            const key = parsedLine[reqDataKey];
            axios
              .get(`http://localhost:${apiPort}/api/load`, {
                headers: {
                  'query-key': key,
                  'query-count': 1,
                  'query-action': action,
                },
              })
              .then((res) => {
                let returnVal = 0;
                if (res.data?.code === 0) {
                  if (res.data?.data?.length >= 1) {
                    const resData = res.data.data;
                    if (resData[0][1].length >= 1) {
                      // TODO: 단말에서의 inferencing 값 요청 대응
                      returnVal = resData[0][1][0][1] as number;
                    }
                  }
                }
                log.info(
                  `<O Return for ${key} ${parsedLine[reqTypeKey]} is ${returnVal}.`,
                );
                port.write(
                  `${vegimiteMagicCodeS}${returnVal}${vegimiteMagicCodeE}`,
                );
              })
              .catch(log.error.bind(log));
          }
        } else {
          log.warn(`>I UNKNOWN: ${line}`);
        }
      }
    });

    parser.on('close', () => {
      log.info(`- [${clientID}] disconnected`);
    });

    parser.on('error', (err) => {
      log.error(`[${clientID}] error: ${err}`);
    });

    port.pipe(parser);

    log.info(`Serial port listening on device ${port.path}`);
  })
  .catch((err) => {
    log.error(err);
  });
