import React from 'react';
import actions from '@popup/store/actions';
import { useAppDispatch } from '@popup/store';

import Button from '@src/components/Button';
import { AlarmState, ModalTab } from '@src/typings';
import { generateId, isPast } from '@src/utils';
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
export default function CreateModal({ visible, loading, setLoading }: TProps) {
  const dispatch = useAppDispatch();

  // states
  const [tab, setTab] = React.useState(ModalTab.onetime);
  const [date, setDate] = React.useState(new Date(new Date().getTime() + 60000));
  const [name, setName] = React.useState('');
  const [repetitionDays, setRepetitionDays] = React.useState<number[]>([]);

  // -------------------------
  // actions
  const onCancel = () => {
    dispatch(actions.setModal({}));
  };

  const onCreate = () => {
    setLoading(true);

    dispatch(
      actions.createAlarm({
        alarm: {
          id: generateId(),
          name,
          date: date.toISOString(),
          repetitive: tab == ModalTab.repetitive,
          repetitionDays,
          state: AlarmState.active,
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
        <div className="flex items-center justify-between px-1 border-b border-cyan">
          <p className="text-lg font-bold text-cyan">Create alarm</p>
        </div>

        <div className="flex p-1">
          <div className="flex flex-col focus:border focus:border-cyan">
            <Time date={date} setDate={setDate} />
            <Datum date={date} setDate={setDate} />
          </div>
          <div className="flex flex-col flex-auto pl-3">
            <input
              id="create-name-input"
              className="transition-all duration-200 ease-in-out px-2 py-1 border border-gray-300 appearance-none rounded-tl rounded-tr w-full bg-transparent focus focus:border-cyan focus:outline-none active:outline-none active:border-cyan dark:text-gray-400 dark:border-gray-500"
              placeholder="Alarm name"
              value={name}
              maxLength={125}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
            <Tabs tab={tab} setTab={setTab} />
          </div>
        </div>

        <Repetitive
          visible={tab == ModalTab.repetitive}
          repetitionDays={repetitionDays}
          setRepetitionDays={setRepetitionDays}
        />

        <InfoText tab={tab} date={date} repetitiveDays={repetitionDays} />

        <div className="flex items-center justify-center mb-2">
          <Button onClick={onCancel} outline>
            Cancel
          </Button>
          <Button onClick={onCreate} className="ml-4" disabled={invalid}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
