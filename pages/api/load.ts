import { Mutex } from 'async-mutex';
import axios from 'axios';
import http from 'http';
import { JSONFile, Low } from 'lowdb'; // eslint-disable-line import/no-unresolved
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
    const action = (I.headers['query-action'] || '__unknown') as string;
    if (key === '__unknown') {
      log.info(doResponse(null, 1, 'No key provided'));
      return;
    }
    if (count <= 0) {
      log.info(doResponse(null, 1, 'Count must be greater than 0'));
      return;
    }

    const data = db.data || {};
    if (!(key in data)) {
      log.info(doResponse([]));
      return;
    }

    let realCount = count;
    if (realCount > data[key].length) {
      realCount = data[key].length;
    }

    const returnData = data[key].slice(-1 * realCount);
    log.info(doResponse(returnData));

    switch (action) {
      case 'set-zero':
        axios({
          method: 'post',
          url: `http://${I.headers.host}/api/save`,
          headers: {
            'Content-Type': 'text/plain',
          },
          data: `${key}=0`,
        }).catch(log.error);
    }

    return;
  }

  log.info(doResponse(null, 1, 'Method not allowed'));
};

export default loadData;
