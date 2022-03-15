import React from 'react';
import Head from 'next/head';
import Typography from '@mui/material/Typography';

import $ from './PageWrapper.module.scss';

interface Props {
  title?: string
  allowCrawling?: boolean
  displayTitleInBody?: boolean
  children?: React.ReactElement | React.ReactElement[]
};

const PageWrapper: React.FC<Props> = function (props: Props) {
  const {
    children, title, allowCrawling, displayTitleInBody,
  } = props;

  const fallbackTitle = title || 'No Title';
  const robots = allowCrawling ? 'noimageindex' : 'noindex,nofollow';

  return (
    <>
      <Head>
        <meta name="robots" content={robots} />
        <title>{fallbackTitle}</title>
        <link href="/favicon.ico" rel="shortcut icon" />
      </Head>
      <div className={$.container}>
        {displayTitleInBody && (<Typography className={$.title} variant="h3" component="h1">{fallbackTitle}</Typography>)}
        <div className={$.boxes}>
          {children}
        </div>
      </div>
    </>
  );
};

PageWrapper.defaultProps = {
  title: undefined,
  allowCrawling: false,
  displayTitleInBody: true,
  children: undefined,
};

export default PageWrapper;
