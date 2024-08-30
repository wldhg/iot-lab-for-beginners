import type { Logger } from 'pino';

export type VSRequest = {
  key: string;
} & ({
  value: number;
  action: 'PUT';
} | {
  action: 'GET' | 'GET+set-zero';
});

export const parseVSRequest = (line: string, log: Logger): VSRequest[] => {
  let parsedLine: Record<string, number> = {};
  line.trim().split(VS_SEP).forEach((l) => {
    try {
      parsedLine = { ...parsedLine, ...JSON.parse(l.trim()) };
    } catch (e) {
      log.error(`>I ERROR ON JSON PARSING ${e}`);
      log.error(`>I ERROR ON JSON PARSING LINE IS ${l}`);
    }
  });

  return Object.keys(parsedLine).map((key) => {
    try {
      const realKey = key.split('!!')[1];
      const value = parsedLine[key];
      if (key.startsWith('PUT!!')) {
        return {
          key: realKey,
          value,
          action: 'PUT',
        };
      } if (key.startsWith('GET!!')) {
        return {
          key: realKey,
          action: 'GET',
        };
      } if (key.startsWith('GET+set-zero!!')) {
        return {
          key: realKey,
          action: 'GET+set-zero',
        };
      }
      log.warn(`>I Unknown action: ${key}`);
      return null;
    } catch (e) {
      log.error(`>I ERROR ON LINE PARSING WITH KEY ${key} IS ${e}`);
      return null;
    }
  }).filter((_) => _ !== null) as VSRequest[];
};

const vegimiteMagicCodeS = '_VGMT_S_';
const vegimiteMagicCodeE = '_VGMT_E_';

export const makeVSResponse = (key: string, data: number): string => `${vegimiteMagicCodeS}${key}=${data}${vegimiteMagicCodeE}`;

export const VS_SEP = '__VGMT__';
