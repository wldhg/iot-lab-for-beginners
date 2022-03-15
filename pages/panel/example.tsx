import React from 'react';
import PageWrapper from 'components/internal/PageWrapper';
import NumberDisplay from 'components/NumberDisplay';
import ConditionLight from 'components/ConditionLight';

const Page: React.FC = function () {
  return (
    <PageWrapper title="AIoT Lab Example">
      <NumberDisplay label="Humidity" dataID="humidity" dataFetchInterval={1000} unit="%" />
      <ConditionLight
        label="Is the air dry?"
        dataID="humidity"
        dataFetchInterval={1000}
        coloringRule={(data: number) => (data < 30 ? '#00FF00' : '#FF0000')}
      />
    </PageWrapper>
  );
};

export default Page;
