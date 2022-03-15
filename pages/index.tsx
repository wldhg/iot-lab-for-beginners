import React from 'react';
import PageWrapper from 'components/internal/PageWrapper';
import Typography from '@mui/material/Typography';

import $ from './index.module.scss';

const IndexPage: React.FC = function () {
  return (
    <PageWrapper title="AIoT Lab" displayTitleInBody={false}>
      <div className={$.container}>
        <img src="./robot.svg" alt="Robot Icon" />
        <Typography variant="h3" component="h1">AIoT Lab에 오신 것을 환영합니다!</Typography>
        <Typography variant="h5" component="h2">이 페이지가 보인다면 AIoT 실습을 위한 원격 웹 서버를 제대로 구동한 것입니다.</Typography>
        <p>&copy; POSTECH Mobile Networking Laboratory.</p>
      </div>
    </PageWrapper>
  );
};

export default IndexPage;
