import React from 'react';
import actions from '@popup/store/actions';
import { useAppDispatch } from '@popup/store';
import { Alarm, AlarmState, ModalType } from '@src/typings';

import TrashSvg from '@src/icons/trash.svgr.svg';
import PencilSvg from '@src/icons/pencil.svgr.svg';
import CogIcon from '@src/icons/cog.svgr.svg';
import MiniToggle from '@src/components/MiniToggle';
import { isPast } from '@src/utils';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly alarm: Alarm;
};

// ---------------------------------------------------------------------------------
export default function AlarmOptions({ alarm }: TProps) {
  const [optionsTimeout, setOptionsTimeout] = React.useState<NodeJS.Timeout | undefined>(undefined);
  const [over, setOver] = React.useState(false);
  const dispatch = useAppDispatch();

  const onMouseOver = () => {
    setOver(true);
    optionsTimeout && clearTimeout(optionsTimeout);
  };

  const onMouseOut = () => {
    let timeout = setTimeout(() => {
      setOver(false);
    }, 1200);
    setOptionsTimeout(timeout);
  };

  const onAlarmDelete = () => {
    setOver(false);
    dispatch(actions.deleteAlarm({ alarmId: alarm.id }));
  };

  const onAlarmEdit = () => {
    setOver(false);
    dispatch(actions.setModal({ modalType: ModalType.edit, alarmEdited: alarm }));
  };

  const canToggleState = !isPast(new Date(alarm.date)) || alarm.repetitive;
  const onAlarmStateChange = (checked: boolean) => {
    let editedAlarm = { ...alarm };
    editedAlarm.state = checked ? AlarmState.active : AlarmState.disabled;
    dispatch(actions.editAlarm({ alarm: editedAlarm }));
  };

  const optionsStyle = {
    width: over ? 112 : 0,
    transition: 'width 0.1s linear',
    paddingRight: 22,
  };
  const optionIconStyle =
    'bg-transparent text-white hover:bg-white hover:text-cyan rounded-full transition-all p-1 cursor-pointer mx-px dark:text-black dark:hover:bg-blackish';

  if (alarm.state === AlarmState.ringing) {
    return null;
  }

  return (
    <div
      className="absolute right-0 h-full bg-cyan text-white"
      style={optionsStyle}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      <div className="flex items-center justify-end w-full h-full overflow-hidden">
        <div className={optionIconStyle} onClick={onAlarmDelete} title="Delete alarm">
          <TrashSvg className="w-5 h-5" />
        </div>
        <div className={optionIconStyle} onClick={onAlarmEdit} title="Edit alarm">
          <PencilSvg className="w-5 h-5" />
        </div>
        <MiniToggle
          checked={alarm.state === AlarmState.active ? true : false}
          onChange={canToggleState ? onAlarmStateChange : undefined}
        />

        <CogIcon className="absolute top-2/4 -mt-2 right-0.5 w-4 h-4 text-white dark:text-black" />
      </div>
    </div>
  );
}
