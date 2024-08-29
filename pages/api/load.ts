import { Mutex } from 'async-mutex';
import axios from 'axios';
import fs from 'fs';
import http from 'http';
import yaml from 'js-yaml';
import { JSONFile, Low } from 'lowdb'; // eslint-disable-line import/no-unresolved
import moment from 'moment';
import { InferenceSession, Tensor } from 'onnxruntime-node';
import path from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';

const log = pino();

const baseFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

type DBContent = FixedLengthArray<number, 2>[];
type DBObject = { [key: string]: DBContent; }
const dbFilePath = path.join(baseFilePath, 'db.json');
const lowAdaptor = new JSONFile<DBObject>(dbFilePath);
const db = new Low<DBObject>(lowAdaptor);
const dbMutex = new Mutex();

let onnxMapping: ONNXModelMapping;
const onnxSessions = new Map<string, InferenceSession>();
const onnxMappingFilePath = path.join(baseFilePath, 'model_map.yaml');
try {
  onnxMapping = yaml.load(fs.readFileSync(onnxMappingFilePath, 'utf8')) as ONNXModelMapping;
} catch (e) {
  log.error(e);
  onnxMapping = { mappings: {} };
}

const loadData = async (I: http.IncomingMessage, O: http.OutgoingMessage) => {
  const doResponse = (data: any, code: number = 0, message: string = 'Load successful') : object => {
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

  if (I.method !== 'GET') {
    log.info(doResponse(null, 1, 'Method not allowed'));
    return;
  }

  const keyStr = (I.headers['query-key'] || '__unknown') as string;
  const countStr = (I.headers['query-count'] || '1') as string;
  const action = (I.headers['query-action'] || '__unknown') as string;
  if (keyStr === '__unknown') {
    log.info(doResponse(null, 1, 'No key provided'));
    return;
  }

  const dbMutexRelease = await dbMutex.acquire();
  try {
    await db.read();
  } finally {
    dbMutexRelease();
  }

  const keys = keyStr.split(',');
  const counts = countStr.split(',').map((_) => Number.parseInt(_, 10));

  const dbData = db.data || {};
  const retData = keys.map((key, i) => {
    let count = 1;
    if (i >= counts.length) count = counts[counts.length - 1];
    else count = counts[i];

    if (!(key in dbData)) {
      return [key, []];
    }

    count = Math.min(Math.max(1, count), dbData[key]?.length || 0);
    return [key, dbData[key].slice(-1 * count)];
  });

  switch (action) {
    case 'set-zero':
      // return first, then save
      log.info(doResponse(retData));
      axios({
        method: 'post',
        url: `http://${I.headers.host}/api/save`,
        headers: {
          'Content-Type': 'text/plain',
        },
        data: keys.map((key) => `${key}=0`).join('\n'),
      }).catch(log.error);
      break;

    case 'inference':
      try {
        const inferencedRet = await Promise.all(
          retData.map(([key]) => {
            if (key as string in dbData) {
              return inferData(key as string, dbData[key as string]);
            }
            return Promise.resolve([]);
          }),
        );
        const infKeys = retData.map(([k]) => `${k}-inf`);
        inferencedRet.forEach((inferenced, i) => {
          retData.push([`${infKeys[i]}`, inferenced]);
        });
        log.info(doResponse(retData));
      } catch (e) {
        log.error(e);
        if (e instanceof Error) {
          log.info(doResponse(null, 2, e.message));
        } else {
          log.info(doResponse(null, 2, 'Unknown inference error'));
        }
        return;
      };
      break;

    default:
      log.info(doResponse(retData));
  }
};

const inferData = async (dataID: string, data: DBContent) : Promise<DBContent> => {
  const timestamp = moment().valueOf();

  if (!(dataID in onnxMapping.mappings)) {
    throw new Error(`No model mapping for ${dataID}`);
  }

  const dataRequiredCount = onnxMapping.mappings[dataID].count;
  if (data.length < dataRequiredCount) {
    throw new Error(`Data length ${data.length} less than required ${dataRequiredCount}`);
  }

  let session = onnxSessions.get(dataID);
  if (!session) {
    const modelName = onnxMapping.mappings[dataID].model_name;
    const modelPath = path.join(baseFilePath, modelName);
    session = await InferenceSession.create(modelPath);
    onnxSessions.set(dataID, session);
  }

  const inputTensor = new Tensor('float32', data.slice(-1 * dataRequiredCount).map(([_, d]) => d), [1, dataRequiredCount, 1]);

  return session.run({ input: inputTensor }).then((outputs) => {
    const timestampAddi = timestamp + onnxMapping.mappings[dataID].timestamp_addi * 1000;
    const outputData = outputs.output.data[0] as number;
    return [[timestampAddi, outputData]];
  });
};

export default loadData;
