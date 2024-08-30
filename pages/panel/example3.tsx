import ConditionLight from 'components/ConditionLight';
import ControlGroup from 'components/ControlGroup';
import PageWrapper from 'components/internal/PageWrapper';
import NumberDisplay from 'components/NumberDisplay';
import React from 'react';

const Page: React.FC = function () {
  return (
    <PageWrapper title="IoT Lab Example">
      <ControlGroup label="DHT Sensor">
        <NumberDisplay label="Temperature" dataID="temperature" unit="℃" />
        <NumberDisplay label="Humidity" dataID="humidity" unit="%" />
        <ConditionLight
          label="Air Humidity Condition"
          dataID="humidity"
          coloringRule={(humidity: number) => (humidity < 85 ? '#00FF00' : '#FF0000')}
        />
      </ControlGroup>
    </PageWrapper>
  );
};

export default Page;
