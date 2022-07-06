import React from 'react';
import Button from '@mui/material/Button';
import axios from 'axios';
import { FetchComponentBaseProps, FetchComponentWrapper } from './internal/FetchComponentWrapper';

import $ from './PushButton.module.scss';

interface Props extends FetchComponentBaseProps {
  buttonText: string
  description?: string
};

const PushButton: React.FC<Props> = function (props: Props) {
  const {
    label, dataID, buttonText, description, action,
  } = props;

  const onClick = () => {
    axios({
      method: 'post',
      url: '/api/save',
      headers: {
        'Content-Type': 'text/plain',
      },
      data: `${dataID}=1`,
    }).catch(console.error); // eslint-disable-line no-console
  };

  return (
    <FetchComponentWrapper
      className={$.container}
      label={label}
      action={action}
      dataID={dataID}
      dataFetchCount={1}
    >
      <Button className={$.button} variant="outlined" onClick={onClick}>{buttonText}</Button>
      <span className={$.description}>{description}</span>
    </FetchComponentWrapper>
  );
};

PushButton.defaultProps = {
  description: '',
};

export default PushButton;
