import React, { useEffect, useContext } from 'react';
import Typography from '@mui/material/Typography';

import GlobalContext from '../../context/global';

import $ from './FetchComponentWrapper.module.scss';

export interface FetchComponentBaseProps {
  label: string
  dataID: string
  // eslint-disable-next-line react/no-unused-prop-types
  dataDispID?: string
  action?: string
};

interface ComponentProps extends FetchComponentBaseProps {
  dataFetchCount?: number
  children?: React.ReactElement | React.ReactElement[]
  className?: string
}

export const FetchComponentWrapper: React.FC<ComponentProps> = function (props: ComponentProps) {
  const {
    children, label, dataID, dataFetchCount, className, action,
  } = props;
  const { addUpdateTarget } = useContext(GlobalContext);

  useEffect(() => {
    addUpdateTarget(dataID, dataFetchCount || 1, action || '__unknown');
  }, [dataID]); // eslint-disable-line react-hooks/exhaustive-deps

  let finalClassName = $.container;
  if (className) {
    finalClassName += ` ${className}`;
  }

  return (
    <div className={finalClassName}>
      <Typography className={$.title} variant="h6" component="h2">{label}</Typography>
      {children}
    </div>
  );
};

FetchComponentWrapper.defaultProps = {
  children: undefined,
  dataFetchCount: 1,
  dataDispID: '__unknown',
  className: undefined,
  action: '__unknown',
};
