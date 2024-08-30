import { DelimiterParser } from '@serialport/parser-delimiter';
import axios from 'axios';
import fsp from 'fs/promises';
import pino from 'pino';
import { SerialPort } from 'serialport';
import { makeVSResponse, parseVSRequest, VS_SEP } from './protocol';

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

fsp
  .readdir('/dev')
  .then((files) => {
    const ttyUSB = files.find((file) => file.startsWith('ttyUSB') || file.startsWith('cu.usbmodem') || file.startsWith('ttyACM'));
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
    const parser = new DelimiterParser({ delimiter: VS_SEP });
    const clientID = port.path;

    parser.on('data', (line) => {
      if (line.length > 0) {
        log.debug(`>I ${line}`);
        const reqs = parseVSRequest(line, log);
        reqs.forEach((req) => {
          if (req.action === 'PUT') {
            log.info(
              `I> ${req.key}=${req.value}`,
            );
            if (!Number.isNaN(req.value)) {
              axios({
                method: 'post',
                url: `http://localhost:${apiPort}/api/save`,
                headers: {
                  'Content-Type': 'text/plain',
                },
                data: `${req.key}=${req.value}`,
              }).catch(log.error.bind(log));
            }
          } else if (req.action.startsWith('GET')) {
            const hasAction = req.action.split('+').length >= 2;
            const action = hasAction ? req.action.split('+')[1] : '';
            axios
              .get(`http://localhost:${apiPort}/api/load`, {
                headers: {
                  'query-key': req.key,
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
                  `<O Return for ${req.key} ${req.action} is ${returnVal}.`,
                );
                port.write(makeVSResponse(req.key, returnVal));
              })
              .catch(log.error.bind(log));
          }
        });
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
