import React, { useEffect } from 'react';
import actions from '@popup/store/actions';
import { useAppDispatch } from '@popup/store';

import Header from './Header';
import Content from './Content';
import Modal from './Modal';

// ---------------------------------------------------------------------------------
export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(actions.init());
  }, []);

  return (
    <div className="relative overflow-hidden flex flex-col h-full dark:bg-blackish">
      <Header />
      <Content />
      <Modal />
    </div>
  );
}
