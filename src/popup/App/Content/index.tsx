import React from 'react';
import actions from '@popup/store/actions';
import { useAppSelector, useAppDispatch } from '@popup/store';

import Loader from './Loader';
import AlarmList from './AlarmList';

// ---------------------------------------------------------------------------------
export default function Content() {
  const isInitialized = useAppSelector(s => s.initialized);
  const dispatch = useAppDispatch();

  return (
    <div className="flex-auto overflow-hidden">{isInitialized ? <AlarmList /> : <Loader />}</div>
  );
}
