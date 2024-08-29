import axios from 'axios';
import net from 'net';
import pino from 'pino';

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
const reqTypeKey = '_VGMT';
const reqDataKey = '_VGMT_K';
const reqDataValue = '_VGMT_V';
const vegimiteMagicCodeS = '_VGMT_S_';
const vegimiteMagicCodeE = '_VGMT_E_';

net
  .createServer((sock) => {
    const clientID = `${sock.remoteAddress}:${sock.remotePort}`;
    log.info(`+ [${clientID}] connected`);
    sock.on('data', (data) => {
      data
        .toString().split(vegimiteMagicCodeS)
        .forEach((line, idx, arr) => {
          if (line.length > 0) {
            log.debug(`>I [${sock.remoteAddress}:${sock.remotePort}] ${line}`);
            let parsedLine: Record<string, any> = {};
            try {
              parsedLine = JSON.parse(line.trim());
            } catch (e) {
              log.error(`>I [${sock.remoteAddress}:${sock.remotePort}] ${e}`);
              log.error(
                `>I [${sock.remoteAddress}:${sock.remotePort}] ${line}`,
              );
              return;
            }
            if (reqTypeKey in parsedLine) {
              if (parsedLine[reqTypeKey] === 'PUT') {
                const key = parsedLine[reqDataKey];
                const value = parsedLine[reqDataValue];
                const nValue = Number.parseFloat(value as string);
                log.info(
                  `I> [${sock.remoteAddress}:${sock.remotePort}] ${key}=${nValue} (${value})`,
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
                      `<O [${sock.remoteAddress}:${
                        sock.remotePort
                      }] Return for ${key} ${parsedLine[reqTypeKey]} is ${returnVal}.`,
                    );
                    sock.write(
                      `${vegimiteMagicCodeS}${returnVal}${vegimiteMagicCodeE}`,
                    );
                  })
                  .catch(log.error.bind(log));
              }
            } else {
              log.warn(`>I [${sock.remoteAddress}:${sock.remotePort}] UNKNOWN: ${line}`);
            }
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
