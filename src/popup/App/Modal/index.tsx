import React from 'react';
import actions from '@popup/store/actions';
import { useAppSelector, useAppDispatch } from '@popup/store';

import { ModalType } from '@src/typings';
import CreateModal from './CreateModal';
import EditModal from './EditModal';
import OptionsModal from './OptionsModal';

// ---------------------------------------------------------------------------------
export default function Modal() {
  const dispatch = useAppDispatch();

  const modalType = useAppSelector(s => s.modalType);
  const [modalRender, setModalRender] = React.useState(modalType);
  const [loading, setLoading] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  // animation tricks, so that only one modal is rendered at the time
  React.useEffect(() => {
    if (modalType) {
      setModalRender(modalType);
      setTimeout(() => {
        setVisible(true);
      }, 50);
    } else {
      setVisible(false);
      setTimeout(() => {
        setModalRender(undefined);
      }, 220);
    }
  }, [modalType]);

  const onBackdropClick = () => {
    !loading && dispatch(actions.setModal({}));
  };

  return (
    <>
      {/* backdrop */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-40
          transition-opacity ease duration-200
          ${!modalType ? '-z-10 opacity-0' : ''}`}
        onClick={onBackdropClick}
      />

      {/* only one can be visible at the time */}
      {modalRender === ModalType.create && (
        <CreateModal visible={visible} loading={loading} setLoading={setLoading} />
      )}
      {modalRender === ModalType.edit && (
        <EditModal visible={visible} loading={loading} setLoading={setLoading} />
      )}
      {modalRender === ModalType.options && (
        <OptionsModal visible={visible} loading={loading} setLoading={setLoading} />
      )}
    </>
  );
}
