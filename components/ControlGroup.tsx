import React from 'react';
import Typography from '@mui/material/Typography';

import $ from './ControlGroup.module.scss';

interface Props {
  label: string
  children?: React.ReactElement | React.ReactElement[]
}

const ControlGroup: React.FC<Props> = function (props: Props) {
  const { children, label } = props;

  return (
    <div className={$.container}>
      <div className={$.titleContainer}>
        <Typography className={$.title} variant="h6" component="h2" data-label={label}>{label}</Typography>
      </div>
      <div className={$.innerContainer}>
        {children}
      </div>
    </div>
  );
};

ControlGroup.defaultProps = {
  children: undefined,
};

export default ControlGroup;
