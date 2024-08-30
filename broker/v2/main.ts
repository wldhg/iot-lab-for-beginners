import axios from 'axios';
import net from 'net';
import pino from 'pino';
import { makeVSResponse, parseVSRequest, VS_SEP } from './protocol';

const port = 3010;
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

net
  .createServer((sock) => {
    const clientID = `${sock.remoteAddress}:${sock.remotePort}`;
    log.info(`+ [${clientID}] connected`);
    sock.on('data', (data) => {
      data
        .toString().split(VS_SEP)
        .forEach((line, idx, arr) => {
          if (line.length > 0) {
            log.debug(`>I [${sock.remoteAddress}:${sock.remotePort}] ${line}`);
            const reqs = parseVSRequest(line, log);
            reqs.forEach((req) => {
              if (req.action === 'PUT') {
                log.info(
                  `I> [${sock.remoteAddress}:${sock.remotePort}] ${req.key}=${req.value}`,
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
                      `<O [${sock.remoteAddress}:${
                        sock.remotePort
                      }] Return for ${req.key} ${req.action} is ${returnVal}.`,
                    );
                    sock.write(makeVSResponse(req.key, returnVal));
                  })
                  .catch(log.error.bind(log));
              }
            });
          }
        });
    });
    sock.on('close', () => {
      log.info(`- [${clientID}] disconnected`);
    });
    sock.on('error', (err) => {
      log.error(`[${clientID}] error: ${err}`);
    });
  })
  .listen(port, '0.0.0.0', () => {
    log.info(`TCP server listening on port ${port}`);
  });
