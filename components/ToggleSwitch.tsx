import React, { useEffect, useState, useContext } from 'react';
import { Switch, Stack, Typography } from '@mui/material';
import axios from 'axios';
import GlobalContext from 'context/global';

import { FetchComponentBaseProps, FetchComponentWrapper } from './internal/FetchComponentWrapper';

import $ from './ToggleSwitch.module.scss';

interface Props extends FetchComponentBaseProps {
  description?: string
};

const ToggleSwitch: React.FC<Props> = function (props: Props) {
  const {
    label, dataID, description, action,
  } = props;
  const { items } = useContext(GlobalContext);
  const [disabled, setDisabled] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (dataID in items) {
      setChecked(items[dataID].value === 1);
    }
    setDisabled(false);
  }, [items, dataID]);

  const onClick = () => {
    setDisabled(true);
    axios({
      method: 'post',
      url: '/api/save',
      headers: {
        'Content-Type': 'text/plain',
      },
      data: `${dataID}=${checked ? 0 : 1}`,
    }).then(() => {
      setChecked(!checked);
      setDisabled(false);
    }).catch((e) => {
      setDisabled(false);
      console.error(e); // eslint-disable-line no-console
    });
  };

  return (
    <FetchComponentWrapper
      className={$.container}
      label={label}
      action={action}
      dataID={dataID}
      dataFetchCount={1}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6">Off</Typography>
        <Switch onClick={onClick} disabled={disabled} checked={checked} />
        <Typography variant="h6">On</Typography>
      </Stack>
      <span className={$.description}>{description}</span>
    </FetchComponentWrapper>
  );
};

ToggleSwitch.defaultProps = {
  description: '',
};

export default ToggleSwitch;
