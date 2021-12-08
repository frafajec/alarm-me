import React from 'react';
import actions from '@popup/store/actions';
import { useAppSelector, useAppDispatch } from '@popup/store';

import Alarm from './Alarm';
import Button from '@src/components/Button';
import { ModalType } from '@src/typings';

// ---------------------------------------------------------------------------------
export default function AlarmList() {
  const alarms = useAppSelector(s => s.alarms);
  const dispatch = useAppDispatch();

  const onCreateAlarmClick = () => {
    dispatch(actions.setModal({ modalType: ModalType.create }));
  };

  if (alarms.length == 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
        <p className="text-lg pb-8 text-gray-600 dark:text-gray-400">
          You don't have any alarms yet, create one!
        </p>
        <Button onClick={onCreateAlarmClick}>Create alarm</Button>
      </div>
    );
  }

  return (
    <div className="alarm-list max-h-80 overflow-auto px-1 pb-32">
      {alarms.map(alarm => (
        <Alarm key={alarm.id} alarm={alarm} />
      ))}
    </div>
  );
}
