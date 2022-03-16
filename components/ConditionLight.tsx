import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import { Moment } from 'moment';
import { FetchComponentBaseProps, FetchComponentWrapper } from './internal/FetchComponentWrapper';

import $ from './ConditionLight.module.scss';

interface Prop extends FetchComponentBaseProps {
  coloringRule: (data: any) => string
  displayValue?: boolean
  dataFetchInterval?: number
};

const ConditionLight: React.FC<Prop> = function (props: Prop) {
  const {
    label, dataID, dataFetchInterval, coloringRule, displayValue,
  } = props;
  const [color, setColor] = useState('transparent');
  const [data, setData] = useState('');
  const [time, setTime] = useState('Loading Data...');

  const dataProcessor = (d: any[][]) => {
    if (d.length > 0) {
      if (displayValue) {
        setData(d[0][1] as string);
      } else {
        setData('');
      }
      setColor(coloringRule(d[0][1]));
      setTime((d[0][0] as Moment).format('YYYY-MM-DD HH:mm:ss'));
    } else {
      setColor('transparent');
      setData('No Data');
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
    >
      <div className={$.box} style={{ backgroundColor: color }}>
        <Typography className={$.number} variant="h3" component="h1">
          {data}
        </Typography>
      </div>
      <span className={$.description}>
        Updated&nbsp;:&nbsp;
        {time}
      </span>
    </FetchComponentWrapper>
  );
};

ConditionLight.defaultProps = {
  dataFetchInterval: 1000,
  displayValue: false,
};

export default ConditionLight;
