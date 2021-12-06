import React from 'react';

import AlarmSvg from '@src/icons/alarm.svgr.svg';
import PlusSvg from '@src/icons/plus-circle.svgr.svg';
import BellCancelSvg from '@src/icons/bell-cancel.svgr.svg';
import { getDateString, getTimeString } from '@src/utils';
import { useAppDispatch } from '@popup/store';
import actions from '@src/popup/store/actions';
import { ModalType } from '@src/typings';

const iconClass =
  'select-none bg-transparent text-cyan hover:bg-cyan hover:text-white rounded-full transition-all p-1 cursor-pointer mx-0.5 dark:hover:text-gray-200';

// ---------------------------------------------------------------------------------
export default function Header() {
  const dispatch = useAppDispatch();
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  });

  const showCreateModal = () => {
    dispatch(actions.setModal({ modalType: ModalType.create }));
  };

  return (
    <div className="flex justify-between p-1 pb-2 border-b border-cyan">
      <p className="flex items-center justify-center text-xl mt-1 dark:text-gray-400">
        <AlarmSvg className="h-6 w-6 mr-1" />
        Alarm me!
      </p>

      <div className="flex items-center">
        <div title="Add alarm" className={iconClass} onClick={showCreateModal}>
          <PlusSvg />
        </div>
        <div title="Cancel ringing" className={iconClass}>
          <BellCancelSvg className="h-5 w-5" />
        </div>

        <div className="flex flex-col items-center justify-center ml-2">
          <p className="font-bold text-sm dark:text-gray-400">
            {getTimeString(now.toISOString(), false)}
          </p>
          <p className="-mt-1 text-xs text-gray-600 dark:text-gray-500">
            {getDateString(now.toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
}
