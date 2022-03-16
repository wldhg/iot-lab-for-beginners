import React from 'react';
import PageWrapper from 'components/internal/PageWrapper';
import Typography from '@mui/material/Typography';

import $ from './index.module.scss';

const IndexPage: React.FC = function () {
  return (
    <PageWrapper title="IoT Lab" displayTitleInBody={false}>
      <div className={$.container}>
        <img src="./robot.svg" alt="Robot Icon" />
        <Typography variant="h3" component="h1">Welcome to the IoT Lab!</Typography>
        <Typography variant="h5" component="h2">If you see this page, you have run the remote web server for IoT practice properly.</Typography>
        <p>Made with ♥️ for IoT.</p>
      </div>
    </PageWrapper>
  );
};

export default IndexPage;
