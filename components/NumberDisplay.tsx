import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import { Moment } from 'moment';
import { FetchComponentBaseProps, FetchComponentWrapper } from './internal/FetchComponentWrapper';

import $ from './NumberDisplay.module.scss';

interface Prop extends FetchComponentBaseProps {
  unit?: string
  dataFetchInterval?: number
};

const NumberDisplay: React.FC<Prop> = function (props: Prop) {
  const {
    label, dataID, dataFetchInterval, unit,
  } = props;
  const [data, setData] = useState(0);
  const [time, setTime] = useState('Loading Data...');

  const dataProcessor = (d: any[][]) => {
    if (d.length > 0) {
      setData(d[0][1] as number);
      setTime((d[0][0] as Moment).format('YYYY-MM-DD HH:mm:ss'));
    } else {
      setTime('No Data');
    }
  };

  return (
    <FetchComponentWrapper
      label={label}
      dataID={dataID}
      dataFetchInterval={dataFetchInterval}
      dataFetchCount={1}
      dataFetchCallback={dataProcessor}
      className={$.container}
    >
      <Typography className={$.number} variant="h3" component="h1">
        {data.toFixed(5)}
        <span className={$.unit}>{`${unit && unit.length > 0 ? ' ' : ''}${unit}`}</span>
      </Typography>
      <span className={$.description}>
        Updated&nbsp;:&nbsp;
        {time}
      </span>
    </FetchComponentWrapper>
  );
};

NumberDisplay.defaultProps = {
  dataFetchInterval: 1000,
  unit: '',
};

export default NumberDisplay;
