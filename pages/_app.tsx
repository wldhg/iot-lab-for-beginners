import React from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';

import './_app.scss';

/* eslint-disable react/jsx-props-no-spreading */
const App = function ({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default App;
