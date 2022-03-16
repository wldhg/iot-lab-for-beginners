import React from 'react';
import PageWrapper from 'components/internal/PageWrapper';
import NumberDisplay from 'components/NumberDisplay';
import ConditionLight from 'components/ConditionLight';
import ControlGroup from 'components/ControlGroup';
import PushButton from 'components/PushButton';
import ToggleSwitch from 'components/ToggleSwitch';

const Page: React.FC = function () {
  return (
    <PageWrapper title="IoT Lab Example">
      <ControlGroup label="DHT Sensor">
        <NumberDisplay label="Temperature" dataID="temperature" dataFetchInterval={1000} unit="℃" />
        <NumberDisplay label="Humidity" dataID="humidity" dataFetchInterval={1000} unit="%" />
        <ConditionLight
          label="Is the air dry?"
          dataID="humidity"
          dataFetchInterval={1000}
          coloringRule={(data: number) => (data < 30 ? '#00FF00' : '#FF0000')}
        />
      </ControlGroup>
      <ControlGroup label="Light Control">
        <NumberDisplay label="LUX" dataID="lux" dataFetchInterval={1000} unit="LUX" />
        <PushButton label="Query LUX" dataID="update-lux" buttonText="Query" description="This takes few seconds." />
        <ToggleSwitch label="LED" dataID="config-light" description="It takes few seconds to be applied." />
      </ControlGroup>
    </PageWrapper>
  );
};

export default Page;
