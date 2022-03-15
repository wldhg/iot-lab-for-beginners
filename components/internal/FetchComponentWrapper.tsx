import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import moment from 'moment';

import $ from './FetchComponentWrapper.module.scss';

export interface FetchComponentBaseProps {
  label: string
  dataID: string
  dataFetchInterval?: number
};

interface ComponentProps extends FetchComponentBaseProps {
  dataFetchCallback: (data: any[][]) => void
  dataFetchCount?: number
  children?: React.ReactElement | React.ReactElement[]
}

export const FetchComponentWrapper: React.FC<ComponentProps> = function (props: ComponentProps) {
  const {
    children, label, dataID, dataFetchInterval, dataFetchCount, dataFetchCallback,
  } = props;

  useEffect(() => {
    const dataFetch = () => {
      axios({
        method: 'get',
        url: '/api/load',
        headers: {
          'query-key': dataID,
          'query-count': Number(dataFetchCount).toString(),
        },
        responseType: 'json',
      }).then((res) => {
        if ('code' in res.data && res.data.code === 0) {
          const data = res.data.data as FixedLengthArray<number, 2>[];
          const momentedData = data.map((item) => ([moment(item[0]), item[1]]));
          dataFetchCallback(momentedData);
        } else {
          console.error('Response code was not zero.'); // eslint-disable-line no-console
          console.error(res); // eslint-disable-line no-console
        }
      }).catch(console.error); // eslint-disable-line no-console
    };
    const interval = setInterval(dataFetch, dataFetchInterval);
    dataFetch();

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={$.container}>
      <Typography className={$.title} variant="h6" component="h2">{label}</Typography>
      {children}
    </div>
  );
};

FetchComponentWrapper.defaultProps = {
  children: undefined,
  dataFetchInterval: 1000,
  dataFetchCount: 1,
};
