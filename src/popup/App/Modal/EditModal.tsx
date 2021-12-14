import React from 'react';
import actions from '@popup/store/actions';
import { useAppDispatch, useAppSelector } from '@popup/store';

import Button from '@src/components/Button';
import { ModalTab } from '@src/typings';
import { isPast } from '@src/utils';
import Tabs from './components/Tabs';
import Time from './components/Time';
import Datum from './components/Datum';
import Repetitive from './components/Repetitive';
import InfoText from './components/InfoText';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly visible: boolean;
  readonly loading: boolean;
  readonly setLoading: (loading: boolean) => void;
};
// ---------------------------------------------------------------------------------
export default function EditModal({ visible, loading, setLoading }: TProps) {
  const dispatch = useAppDispatch();
  const alarmEdited = useAppSelector(s => s.alarmEdited);

  // states
  const [tab, setTab] = React.useState(ModalTab.onetime);
  const [date, setDate] = React.useState(new Date());
  const [name, setName] = React.useState('');
  const [repetitionDays, setRepetitionDays] = React.useState<number[]>([]);

  // -------------------------
  // reset field values
  React.useEffect(() => {
    if (alarmEdited) {
      setLoading(false);
      setTab(alarmEdited.repetitive ? ModalTab.repetitive : ModalTab.onetime);
      setDate(new Date(alarmEdited.date));
      setName(alarmEdited.name || '');
      setRepetitionDays([...alarmEdited.repetitionDays]);
    }
  }, [alarmEdited, visible]);

  // -------------------------
  // actions
  const onCancel = () => {
    dispatch(actions.setModal({}));
  };

  const onEdit = () => {
    setLoading(true);

    dispatch(
      actions.editAlarm({
        alarm: {
          id: alarmEdited!.id,
          name,
          date: date.toISOString(),
          repetitive: tab == ModalTab.repetitive,
          repetitionDays,
          state: alarmEdited!.state,
        },
      })
    );
  };

  // -------------------------
  // ui
  const modalStyle = {
    transition: 'height 200ms ease',
    height: visible ? (tab == ModalTab.onetime ? 200 : 260) : 0,
  };

  const invalid = isPast(date) && !(tab == ModalTab.repetitive && repetitionDays.length > 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-blackish" style={modalStyle}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-1 border-b border-orange">
          <p className="text-lg font-bold text-orange">Edit alarm</p>
        </div>

        <div className="flex p-1">
          <div className="flex flex-col focus:border focus:border-orange">
            {alarmEdited && (
              <>
                <Time date={date} setDate={setDate} />
                <Datum date={date} setDate={setDate} />
              </>
            )}
          </div>
          <div className="flex flex-col flex-auto pl-3">
            <input
              id="create-name-input"
              className="transition-all duration-200 ease-in-out px-2 py-1 border border-gray-300 appearance-none rounded-tl rounded-tr w-full bg-transparent focus focus:border-orange focus:outline-none active:outline-none active:border-orange dark:text-gray-400 dark:border-gray-500"
              placeholder="Alarm name"
              value={name}
              maxLength={125}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
            <Tabs tab={tab} setTab={setTab} alt />
          </div>
        </div>

        <Repetitive
          visible={tab == ModalTab.repetitive}
          repetitionDays={repetitionDays}
          setRepetitionDays={setRepetitionDays}
          alt
        />

        <InfoText tab={tab} date={date} repetitiveDays={repetitionDays} />

        <div className="flex items-center justify-center mb-2">
          <Button onClick={onCancel} outline alt>
            Cancel
          </Button>
          <Button onClick={onEdit} className="ml-4" disabled={invalid} alt>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
