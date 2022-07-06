import React, { useState, useEffect, useContext } from 'react';
import Typography from '@mui/material/Typography';
import { Moment } from 'moment';
import GlobalContext from 'context/global';

import { FetchComponentBaseProps, FetchComponentWrapper } from './internal/FetchComponentWrapper';

import $ from './NumberDisplay.module.scss';

interface Prop extends FetchComponentBaseProps {
  unit?: string
};

const NumberDisplay: React.FC<Prop> = function (props: Prop) {
  const {
    label, dataID, unit, action, dataDispID,
  } = props;
  const { items } = useContext(GlobalContext);
  const [data, setData] = useState(0);
  const [time, setTime] = useState('Loading Data...');

  const dataIDForDisp = (dataDispID && dataDispID !== '__unknown') ? dataDispID : dataID;

  useEffect(() => {
    if (dataIDForDisp in items) {
      setData(items[dataIDForDisp].value || 0);
      setTime(items[dataIDForDisp].timestamp.format('YYYY-MM-DD HH:mm:ss'));
    } else {
      setTime('No Data');
    }
  }, [items, dataIDForDisp]);

  return (
    <FetchComponentWrapper
      label={label}
      action={action}
      dataID={dataID}
      dataFetchCount={1}
      className={$.container}
    >
      <Typography className={$.number} variant="h3" component="h1">
        {data?.toFixed(5)}
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
  unit: '',
};

export default NumberDisplay;
