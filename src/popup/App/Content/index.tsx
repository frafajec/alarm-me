import React from 'react';
import { useAppSelector } from '@popup/store';

import Loader from './Loader';
import AlarmList from './AlarmList';

// ---------------------------------------------------------------------------------
export default function Content() {
  const isInitialized = useAppSelector(s => s.initialized);

  return (
    <div className="flex-auto overflow-hidden">{isInitialized ? <AlarmList /> : <Loader />}</div>
  );
}
