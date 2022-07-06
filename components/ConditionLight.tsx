import React, { useState, useEffect, useContext } from 'react';
import Typography from '@mui/material/Typography';
import { Moment } from 'moment';
import GlobalContext from 'context/global';

import { FetchComponentBaseProps, FetchComponentWrapper } from './internal/FetchComponentWrapper';

import $ from './ConditionLight.module.scss';

interface Prop extends FetchComponentBaseProps {
  coloringRule: (data: any) => string
  displayValue?: boolean
};

const ConditionLight: React.FC<Prop> = function (props: Prop) {
  const {
    label, dataID, coloringRule, displayValue, action, dataDispID,
  } = props;
  const { items } = useContext(GlobalContext);
  const [color, setColor] = useState('transparent');
  const [data, setData] = useState('');
  const [time, setTime] = useState('Loading Data...');

  const dataIDForDisp = (dataDispID && dataDispID !== '__unknown') ? dataDispID : dataID;

  useEffect(() => {
    if (dataIDForDisp in items) {
      if (displayValue) {
        setData(items[dataIDForDisp].value.toString());
      } else {
        setData('');
      }
      setColor(coloringRule(items[dataIDForDisp].value));
      setTime((items[dataIDForDisp].timestamp as Moment).format('YYYY-MM-DD HH:mm:ss'));
    } else {
      setColor('transparent');
      setData('No Data');
      setTime('No Data');
    }
  }, [items, dataIDForDisp, coloringRule, displayValue]);

  return (
    <FetchComponentWrapper
      label={label}
      action={action}
      dataID={dataID}
      dataFetchCount={1}
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
  displayValue: false,
};

export default ConditionLight;
