import React from 'react';
import actions from '@popup/store/actions';
import { useAppSelector, useAppDispatch } from '@popup/store';

import Alarm from './Alarm';

// ---------------------------------------------------------------------------------
export default function AlarmList() {
  const alarms = useAppSelector(s => s.alarms);
  const dispatch = useAppDispatch();

  if (alarms.length == 0) {
    return (
      <div>
        <p className="">You don't have an alarm yet, create one!</p>
        <button>Create alarm</button>
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
