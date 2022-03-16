import React from 'react';
import PageWrapper from 'components/internal/PageWrapper';
import NumberDisplay from 'components/NumberDisplay';
import ConditionLight from 'components/ConditionLight';
import ControlGroup from 'components/ControlGroup';
import PushButton from 'components/PushButton';
import ToggleSwitch from 'components/ToggleSwitch';

const Page: React.FC = function () {
  return (
    <PageWrapper title="AIoT Lab Example">
      <ControlGroup label="온습도 센서">
        <NumberDisplay label="온도" dataID="temperature" dataFetchInterval={1000} unit="℃" />
        <NumberDisplay label="습도" dataID="humidity" dataFetchInterval={1000} unit="%" />
        <ConditionLight
          label="Is the air dry?"
          dataID="humidity"
          dataFetchInterval={1000}
          coloringRule={(data: number) => (data < 30 ? '#00FF00' : '#FF0000')}
        />
      </ControlGroup>
      <ControlGroup label="빛 조작">
        <NumberDisplay label="LUX" dataID="lux" dataFetchInterval={1000} unit="LUX" />
        <PushButton label="LUX 조회" dataID="update-lux" buttonText="조회하기" description="몇 초 걸립니다." />
        <ToggleSwitch label="LED" dataID="config-light" description="반영에 몇 초 걸립니다." />
      </ControlGroup>
    </PageWrapper>
  );
};

export default Page;
