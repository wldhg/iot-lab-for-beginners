import { Mutex } from 'async-mutex';
import http from 'http';
import { JSONFile, Low } from 'lowdb';
import path from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';

const log = pino();

type DBObject = { [key: string]: FixedLengthArray<number, 2>[]; }
const dbFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'db.json');
const lowAdaptor = new JSONFile<DBObject>(dbFilePath);
const db = new Low<DBObject>(lowAdaptor);
const dbMutex = new Mutex();

const loadData = async (I: http.IncomingMessage, O: http.OutgoingMessage) => {
  const doResponse = (data: any, code: number = 0, message: string = 'Save successful') : object => {
    let realMessage = message;
    if (code === 0) realMessage = 'Load successful';
    const returnObject = {
      code,
      message: realMessage,
      data,
    };
    O.setHeader('Content-Type', 'application/json; charset=utf-8');
    O.end(JSON.stringify(returnObject));
    return returnObject;
  };

  if (I.method === 'GET') {
    const dbMutexRelease = await dbMutex.acquire();
    try {
      await db.read();
    } finally {
      dbMutexRelease();
    }

    const key = (I.headers['query-key'] || '__unknown') as string;
    const count = Number.parseInt((I.headers['query-count'] || 1) as string, 10);
    if (key === '__unknown') {
      return log.info(doResponse(null, 1, 'No key provided'));
    }
    if (count <= 0) {
      return log.info(doResponse(null, 1, 'Count must be greater than 0'));
    }

    const data = db.data || {};
    if (!(key in data)) {
      return log.info(doResponse([]));
    }

    let realCount = count;
    if (realCount > data[key].length) {
      realCount = data[key].length;
    }

    const returnData = data[key].slice(-1 * realCount);
    return log.info(doResponse(returnData));
  }

  log.info(doResponse(null, 1, 'Method not allowed'));
};

export default loadData;
