/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { Component, ReactNode, useCallback, useEffect, useState } from 'react';
import { i18n } from '@kbn/i18n';
import moment from 'moment-timezone';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInputPopover,
} from '@elastic/eui';
import type { TimeRange } from '@kbn/es-query';
import { useReduxEmbeddableContext } from '@kbn/presentation-util-plugin/public';
import { timeSliderReducers } from '../time_slider_reducers';
import { TimeSliderReduxState } from '../types';
import { TimeSliderPopoverButton } from './time_slider_popover_button';
import { TimeSliderPopoverContent } from './time_slider_popover_content';
import { getInterval, getTicks } from './time_utils';

import './index.scss';

const FROM_INDEX = 0;
const TO_INDEX = 1;

export interface Props {
  dateFormat?: string;
  timezone?: string;
}

export const TimeSlider: FC<Props> = (props) => {
  const defaultProps = {
    dateFormat: 'MMM D, YYYY @ HH:mm:ss.SSS',
    timezone: 'Browser',
    ...props,
  };
  const { timezone, dateFormat } = defaultProps;

  const {
    useEmbeddableDispatch,
    actions,
    useEmbeddableSelector: select,
  } = useReduxEmbeddableContext<TimeSliderReduxState, typeof timeSliderReducers>();
  const dispatch = useEmbeddableDispatch();

  const timeRangeBounds = select((state) => {
    return state.componentState.timeRangeBounds;
  });
  const timeRangeMin = timeRangeBounds[FROM_INDEX];
  const timeRangeMax = timeRangeBounds[TO_INDEX];
  const value = select((state) => {
    return state.explicitInput.value;
  });
  
  const interval = getInterval(timeRangeMin, timeRangeMax);
  const [range, setRange] = useState(interval);
  const [ticks, setTicks] = useState([]);
  useEffect(() => {
    setTicks(getTicks(timeRangeMin, timeRangeMax, interval, timezone));
  }, [interval, timezone]);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const togglePopover = useCallback(() => {
    setIsPopoverOpen(!isPopoverOpen);
  }, [isPopoverOpen, setIsPopoverOpen]);

  const getTimezone = useCallback(() => {
    const detectedTimezone = moment.tz.guess();

    return timezone === 'Browser' ? detectedTimezone : timezone;
  }, [timezone]);

  const epochToKbnDateFormat = useCallback(
    (epoch: number) => {
      const tz = getTimezone();
      return moment.tz(epoch, tz).format(dateFormat);
    },
    [dateFormat, getTimezone]
  );

  const onRangeSliderChange = useCallback(
    (value: [number, number]) => {
      setRange(value[TO_INDEX] - value[FROM_INDEX]);
      dispatch(actions.setValue({ value }));
    },
    []
  );

  const onNext  = useCallback(
    () => {
      const from = value === undefined || value[TO_INDEX] === timeRangeMax
        ? ticks[0].value
        : value[TO_INDEX];
      const to = from + range;
      dispatch(actions.setValue({ value: [from, Math.min(to, timeRangeMax)] }));
    },
    [ticks, timeRangeMax, value]
  );

  const onPrevious  = useCallback(
    () => {
      const to = value === undefined || value[FROM_INDEX] === timeRangeMin
        ? ticks[ticks.length - 1].value
        : value[FROM_INDEX];
    const from = to - range;
    dispatch(actions.setValue({ value: [Math.max(from, timeRangeMin), to] }));
    },
    [ticks, timeRangeMin, value]
  );

  const from = value ? value[FROM_INDEX] : timeRangeMin;
  const to = value ? value[TO_INDEX] : timeRangeMax;
  
  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          onClick={onPrevious}
          iconType="framePrevious"
          color="text"
          aria-label={i18n.translate('xpack.maps.timeslider.previousTimeWindowLabel', {
            defaultMessage: 'Previous time window',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          onClick={onNext}
          iconType="frameNext"
          color="text"
          aria-label={i18n.translate('xpack.maps.timeslider.nextTimeWindowLabel', {
            defaultMessage: 'Next time window',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={true}>
        <EuiInputPopover
          input={<TimeSliderPopoverButton onClick={togglePopover} formatDate={epochToKbnDateFormat} from={from} to={to} />}
          isOpen={isPopoverOpen}
          closePopover={() => setIsPopoverOpen(false)}
          panelPaddingSize="s"
          anchorPosition="downCenter"
          disableFocusTrap
          attachToAnchor={false}
        >
          <TimeSliderPopoverContent
            key={`${timeRangeMin}_${timeRangeMax}`} // force new instance when time range changes to reset local state
            initialValue={[from, to]}
            onChange={onRangeSliderChange}
            ticks={ticks}
            timeRangeMin={timeRangeMin}
            timeRangeMax={timeRangeMax}
          />
        </EuiInputPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
