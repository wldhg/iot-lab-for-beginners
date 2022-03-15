import { Mutex } from 'async-mutex';
import http from 'http';
import { JSONFile, Low } from 'lowdb';
import moment from 'moment';
import path from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';

const log = pino();

type DBObject = { [key: string]: FixedLengthArray<number, 2>[]; }
const dbFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'db.json');
const lowAdaptor = new JSONFile<DBObject>(dbFilePath);
const db = new Low<DBObject>(lowAdaptor);
const dbMutex = new Mutex();
let isDBReady = false;

const saveData = async (I: http.IncomingMessage, O: http.OutgoingMessage) => {
  const dbMutexRelease = await dbMutex.acquire();
  try {
    if (!isDBReady) {
      await db.read();
      isDBReady = true;
      log.info(`DB is ready, on : ${dbFilePath}`);
    }
  } finally {
    dbMutexRelease();
  }

  const doResponse = (code: number = 0, message: string = 'Save successful') : object => {
    let realMessage = message;
    if (code === 0) realMessage = 'Save successful';
    const returnObject = {
      code,
      message: realMessage,
    };
    O.setHeader('Content-Type', 'application/json; charset=utf-8');
    O.end(JSON.stringify(returnObject));
    return returnObject;
  };

  if (I.method === 'POST') {
    // @ts-ignore
    if (I.body === null) {
      log.info(doResponse(1, 'No data provided'));
      return;
    }

    // @ts-ignore
    const receivedData = I.body
      .split('\n')
      .map((line: string) => {
        if (line.includes('=')) {
          return { k: line.split('=')[0], v: line.split('=')[1] };
        }
        return null;
      }).filter(Boolean);

    const data = db.data || {};
    receivedData.forEach((obj: { [key: string]: string; }) => {
      const { k, v } = obj;

      const vTime: FixedLengthArray<number, 2> = [moment().valueOf(), Number.parseFloat(v)];
      if (Number.isNaN(vTime[1])) {
        log.info(doResponse(2, `Invalid value for ${k} : ${v}`));
        return;
      }

      if (k in data) {
        data[k].push(vTime);
      } else {
        data[k] = [vTime];
      }
    });
    db.data = data;
    await db.write();

    log.info(doResponse());
  } else {
    log.info(doResponse(1, 'Method not allowed'));
  }
};

export default saveData;
