/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext, useState, useRef } from 'react';
import moment, { Moment } from 'moment';
import axios from 'axios';

const globalRunnerRef: {
  current: null | (() => number);
} = {
  current: null,
};

const globalRunnerWrapper = () => {
  if (globalRunnerRef.current !== null) {
    setTimeout(globalRunnerWrapper, globalRunnerRef.current());
  } else {
    setTimeout(globalRunnerWrapper, 1000);
  }
};

globalRunnerWrapper();

export type GlobalItemObject = { [key: string]: {
  timestamp: Moment;
  count: number;
  value: number;
  action: string;
  request: boolean;
} };

export type GlobalContextT = {
  readonly items: GlobalItemObject;
  addUpdateTarget: (target: string, count: number, action: string) => void;
  setInterval: (interval: number) => void;
  readonly lastUpdate: number;
};

const GlobalContextDefault: GlobalContextT = {
  items: {},
  addUpdateTarget: () => {},
  setInterval: () => {},
  lastUpdate: 0,
};
const GlobalContext = createContext<GlobalContextT>(GlobalContextDefault);
export default GlobalContext;

type GlobalContextProps = {
  children: React.ReactNode;
};
export function GlobalContextProvider(props: GlobalContextProps) {
  const { children } = props;

  const [items, setItems] = useState<GlobalItemObject>({});
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const interval = useRef<number>(1000);
  const itemRef = useRef<GlobalItemObject>({});

  const addUpdateTarget = (target: string, count: number, action = '__unknown') => {
    if (target in itemRef.current) {
      itemRef.current[target].count = count;
      itemRef.current[target].action = action;
      itemRef.current[target].request = true;
    } else {
      itemRef.current[target] = {
        timestamp: moment(),
        count,
        action,
        value: 0,
        request: true,
      };
    }
  };

  globalRunnerRef.current = () => {
    const keys = Object.keys(itemRef.current);
    [...new Set(keys.map((key) => itemRef.current[key].action))].forEach((action) => {
      const queryKeys: string[] = [];
      const queryCounts: number[] = [];
      keys.forEach((key) => {
        if (itemRef.current[key].action === action && itemRef.current[key].request) {
          queryKeys.push(key);
          queryCounts.push(itemRef.current[key].count);
        }
      });
      const queryKey = queryKeys.join(',');
      const queryCount = queryCounts.join(',');
      axios({
        method: 'get',
        url: '/api/load',
        headers: {
          'query-key': queryKey,
          'query-count': queryCount,
          'query-action': action,
        },
        responseType: 'json',
      }).then((res) => {
        if ('code' in res.data && res.data.code === 0) {
          const data = res.data.data as
          FixedLengthArray<string | FixedLengthArray<number, 2>[], 2>[];
          const momentedData = data.map(([key, item]) => {
            if (item.length === 0 || item[0].length === 0) {
              return {
                k: String(key),
                v: [moment(), 0],
              };
            }
            return ({
              k: String(key),
              v: [moment(item[item.length - 1][0]), item[item.length - 1][1]],
            });
          });
          itemRef.current = {
            ...itemRef.current,
            ...momentedData.reduce(
              (acc, cur) => {
                let isRequested = false;
                if (cur.k in itemRef.current) {
                  isRequested = itemRef.current[cur.k].request;
                }
                acc[cur.k] = {
                  count: itemRef.current[cur.k]?.count || 0,
                  action: itemRef.current[cur.k]?.action || '__unknown',
                  timestamp: cur.v[0] as Moment,
                  value: cur.v[1] as number,
                  request: isRequested,
                };
                return acc;
              },
             {} as GlobalItemObject,
            ),
          };
          setItems(itemRef.current);
          setLastUpdate(Date.now());
        } else {
          console.error('Response code was not zero.'); // eslint-disable-line no-console
          console.error(res); // eslint-disable-line no-console
        }
      }).catch(console.error); // eslint-disable-line no-console
    });
    return Math.max(interval.current, 100);
  };

  const setInterval = (t: number) => {
    interval.current = t;
  };

  return (
    <GlobalContext.Provider
      value={{
        items,
        addUpdateTarget,
        setInterval,
        lastUpdate,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
