import React from 'react';
import actions from '@popup/store/actions';
import { useAppDispatch } from '@popup/store';
import { Alarm, AlarmState } from '@src/typings';

import BellCancelIcon from '@src/icons/bell-cancel.svgr.svg';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly alarm: Alarm;
};

// ---------------------------------------------------------------------------------
export default function AlarmRinging({ alarm }: TProps) {
  const dispatch = useAppDispatch();

  const onStopRingingClick = () => {
    dispatch(actions.stopAlarm({ alarm }));
  };

  const optionIconStyle =
    'bg-transparent text-white hover:bg-white hover:text-cyan rounded-full transition-all p-1 cursor-pointer mx-0.5 dark:text-black dark:hover:bg-blackish';

  if (alarm.state !== AlarmState.ringing) {
    return null;
  }
  return (
    <div className="absolute right-0 flex items-center justify-center w-12 h-full bg-cyan text-white dark:text-black">
      <div
        className={optionIconStyle + ' ringing'}
        onClick={onStopRingingClick}
        title="Stop ringing"
      >
        <BellCancelIcon className="w-5 h-5" />
      </div>
    </div>
  );
}
