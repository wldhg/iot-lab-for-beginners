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
        <NumberDisplay label="Temperature" dataID="temperature" unit="℃" />
        <NumberDisplay label="Humidity" dataID="humidity" unit="%" />
        <ConditionLight
          label="Air Humidity Condition"
          dataID="humidity"
          coloringRule={(humidity: number) => (humidity < 85 ? '#00FF00' : '#FF0000')}
        />
      </ControlGroup>
      {/*
      <ControlGroup label="H/T Inference">
        <NumberDisplay
          label="Temperature After 1m"
          dataID="temperature"
          dataDispID="temperature-inf"
          action="inference"
          unit="℃"
        />
        <NumberDisplay
          label="Humidity After 1m"
          dataID="humidity"
          dataDispID="humidity-inf"
          action="inference"
          unit="%"
        />
      </ControlGroup>
      */}
      <ControlGroup label="Soil Control">
        <NumberDisplay label="Soil Moisture" dataID="soilmoist" unit="%" />
        <PushButton
          label="Pump"
          dataID="pump-water"
          buttonText="Pump Up"
          description="Push this button to pump water for 5 seconds"
        />
        <ToggleSwitch label="LED" dataID="config-light" />
      </ControlGroup>
      <ControlGroup label="Fan Control">
        <SliderControl
          label="Fan Speed"
          dataID="config-fan"
          min={0}
          max={100}
          description="It takes few seconds to be applied."
          unit="%"
        />
      </ControlGroup>
    </PageWrapper>
  );
};

export default Page;
