import React from 'react';
import actions from '@popup/store/actions';
import { useAppDispatch } from '@popup/store';
import { Alarm, ModalType } from '@src/typings';
import { getDateString, getTimeString, isPast, isToday } from '@src/utils';

import TrashSvg from '@src/icons/trash.svgr.svg';
import PencilSvg from '@src/icons/pencil.svgr.svg';
import CogIcon from '@src/icons/cog.svgr.svg';
import Description from './Description';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly alarm: Alarm;
};

// ---------------------------------------------------------------------------------
export default function Alarm({ alarm }: TProps) {
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

  const optionsStyle = {
    width: over ? 106 : 0,
    transition: 'width 0.1s linear',
    paddingRight: 22,
  };
  const optionIconStyle =
    'bg-transparent text-white hover:bg-white hover:text-cyan rounded-full transition-all p-1 cursor-pointer mx-0.5 dark:text-black dark:hover:bg-blackish';
  const showDate = !isToday(alarm.date) || (!alarm.repetitive && isPast(new Date(alarm.date)));

  return (
    <div className="rounded-md border border-cyan my-2 flex align-center relative overflow-hidden">
      <div className="flex flex-col items-center justify-center w-20 h-11">
        <p className="font-bold text-lg dark:text-gray-400">{getTimeString(alarm.date)}</p>
        {showDate && (
          <p className="-mt-1.5 text-gray-600 dark:text-gray-500">{getDateString(alarm.date)}</p>
        )}
      </div>
      <div className="flex flex-col items-start justify-center border-l border-cyan border-opacity-50 py-0.5 px-1.5">
        <div
          className="font-bold text-gray-800 pr-5 overflow-hidden overflow-ellipsis whitespace-nowrap w-52 dark:text-gray-400"
          title={alarm.name}
        >
          {alarm.name || <span className="text-gray-500 italic">No name</span>}
        </div>
        <Description alarm={alarm} />
      </div>

      <div
        className="absolute right-0 h-full bg-cyan text-white"
        style={optionsStyle}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      >
        <div className="flex items-center justify-end w-full h-full p-2 overflow-hidden">
          <div className={optionIconStyle} onClick={onAlarmDelete} title="Delete alarm">
            <TrashSvg />
          </div>
          <div className={optionIconStyle} onClick={onAlarmEdit} title="Edit alarm">
            <PencilSvg />
          </div>

          <CogIcon className="absolute top-2/4 -mt-2 right-0.5 w-4 h-4 text-white dark:text-black" />
        </div>
      </div>
    </div>
  );
}
