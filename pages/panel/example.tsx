import React from 'react';
import PageWrapper from 'components/internal/PageWrapper';
import NumberDisplay from 'components/NumberDisplay';
import ConditionLight from 'components/ConditionLight';
import ControlGroup from 'components/ControlGroup';
import PushButton from 'components/PushButton';
import ToggleSwitch from 'components/ToggleSwitch';
import SliderControl from 'components/SliderControl';

const Page: React.FC = function () {
  return (
    <PageWrapper title="IoT Lab Example">
      <ControlGroup label="DHT Sensor">
        <NumberDisplay label="Temperature" dataID="temperature" dataFetchInterval={1000} unit="℃" />
        <NumberDisplay label="Humidity" dataID="humidity" dataFetchInterval={1000} unit="%" />
        <ConditionLight
          label="Air Humidity Condition"
          dataID="humidity"
          dataFetchInterval={1000}
          coloringRule={(humidity: number) => (humidity < 85 ? '#00FF00' : '#FF0000')}
        />
      </ControlGroup>
      {/*
      <ControlGroup label="H/T Inference">
        <NumberDisplay
          label="Temperature After 1m"
          dataID="temperature"
          action="inference"
          dataFetchInterval={1000}
          unit="℃"
        />
        <NumberDisplay
          label="Humidity After 1m"
          dataID="humidity"
          action="inference"
          dataFetchInterval={1000}
          unit="%"
        />
      </ControlGroup>
      */}
      <ControlGroup label="Light Control">
        <NumberDisplay label="LUX" dataID="lux" dataFetchInterval={1000} unit="LUX" />
        <PushButton label="Query LUX" dataID="update-lux" buttonText="Query" description="This takes few seconds." />
        <ToggleSwitch label="LED" dataID="config-light" description="It takes few seconds to be applied." />
      </ControlGroup>
      <ControlGroup label="Servo Control">
        <SliderControl
          label="Angle"
          dataID="config-servo"
          min={0}
          max={180}
          description="It takes few seconds to be applied."
          unit="°"
        />
      </ControlGroup>
    </PageWrapper>
  );
};

export default Page;
