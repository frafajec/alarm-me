import React from 'react';
import actions from '@popup/store/actions';
import { useAppDispatch, useAppSelector } from '@popup/store';

import QuestionIcon from '@src/icons/question.svgr.svg';
import PlayIcon from '@src/icons/play.svgr.svg';
import Button from '@src/components/Button';
import Toggle from '@src/components/Toggle';
import { tones, toneList, timeFormats, dateFormats } from '@src/typings';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly visible: boolean;
  readonly loading: boolean;
  readonly setLoading: (loading: boolean) => void;
};
// ---------------------------------------------------------------------------------
export default function OptionsModal({ visible, loading, setLoading }: TProps) {
  const dispatch = useAppDispatch();
  const options = useAppSelector(s => s.options);

  // state
  const [snooze, setSnooze] = React.useState(options.snooze);
  const [stopAfter, setStopAfter] = React.useState(options.stopAfter);
  const [tone, setTone] = React.useState(options.tone);
  const [currentTone, setCurrentTone] = React.useState<HTMLAudioElement | undefined>(undefined);
  const [timeFormat, setTimeFormat] = React.useState(options.timeFormat);
  const [dateFormat, setDateFormat] = React.useState(options.dateFormat);

  // handlers
  const onCancel = () => {
    dispatch(actions.setModal({}));
  };

  const onInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (nbr: number) => void
  ) => {
    let value = e.target.value;
    if (value.length === 0) value = '0';
    if (value.length === 2) {
      const split = value.split('');
      if (split[0] == '0') value = split[1];
    }
    if (value.length > 2) return;

    const parsed = parseInt(value);
    if (parsed < 0) return;
    callback(parsed);
  };

  const onPlayClick = (e: React.MouseEvent) => {
    if (currentTone) {
      currentTone.pause();
      setCurrentTone(undefined);
    } else {
      const currentTone = toneList[tone];
      setCurrentTone(currentTone);
      currentTone.currentTime = 0;
      currentTone.play();
      setTimeout(() => {
        currentTone.pause();
        setCurrentTone(undefined);
      }, 10000);
    }
  };

  const onSave = () => {
    dispatch(
      actions.optionsChange({
        snooze,
        stopAfter,
        tone,
        timeFormat,
        dateFormat,
      })
    );
  };

  // -------------------------
  // ui
  const modalStyle = {
    transition: 'height 200ms ease',
    height: visible ? 285 : 0,
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-blackish" style={modalStyle}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-1 border-b border-cyan">
          <p className="text-lg font-bold text-cyan">Options</p>
        </div>

        <OptionsRow label="Stop ringing after" subLabel="0 = alarm rings until user action">
          <input
            id="options-ringing-duration"
            type="number"
            className="transition-all w-full px-2 py-1 border border-gray-300 rounded appearance-none bg-transparent focus focus:border-cyan focus:outline-none active:outline-none active:border-cyan dark:text-gray-400 dark:border-gray-500"
            placeholder="Alarm name"
            value={stopAfter.toString()}
            onChange={e => onInputChange(e, setStopAfter)}
            maxLength={2}
          />
        </OptionsRow>

        <Divider />

        <OptionsRow label="Snooze duration" subLabel="0 = snooze is disabled">
          <input
            id="options-ringing-duration"
            type="number"
            className="transition-all w-full px-2 py-1 border border-gray-300 rounded appearance-none bg-transparent focus focus:border-cyan focus:outline-none active:outline-none active:border-cyan dark:text-gray-400 dark:border-gray-500"
            placeholder="Alarm name"
            value={snooze.toString()}
            onChange={e => onInputChange(e, setSnooze)}
            maxLength={2}
          />
        </OptionsRow>

        <Divider />

        <OptionsRow label="Time format">
          <select
            className="w-full cursor-pointer bg-transparent border border-gray-300 outline-none p-1 pl-px rounded dark:text-gray-400 dark:border-gray-500"
            value={timeFormat}
            onChange={e => setTimeFormat(e.target.selectedIndex)}
          >
            {timeFormats.map((format, i) => (
              <option key={i} value={i}>
                {format}
              </option>
            ))}
          </select>
        </OptionsRow>

        <Divider />

        <OptionsRow label="Date format">
          <select
            className="w-full cursor-pointer bg-transparent border border-gray-300 outline-none p-1 pl-px rounded dark:text-gray-400 dark:border-gray-500"
            value={dateFormat}
            onChange={e => setDateFormat(e.target.selectedIndex)}
          >
            {dateFormats.map((format, i) => (
              <option key={i} value={i}>
                {format}
              </option>
            ))}
          </select>
        </OptionsRow>

        <Divider />

        <OptionsRow label="Alarm tone">
          <select
            className="w-full cursor-pointer bg-transparent border border-gray-300 outline-none p-1 pl-px rounded dark:text-gray-400 dark:border-gray-500"
            value={tone}
            onChange={e => setTone(e.target.selectedIndex)}
          >
            {tones.map((tone, i) => (
              <option key={i} value={i}>
                {tone}
              </option>
            ))}
          </select>
          <PlayIcon
            className="w-6 h-6 ml-1 cursor-pointer hover:text-cyan dark:text-gray-400"
            onClick={onPlayClick}
          />
        </OptionsRow>

        <Divider />

        {/* <OptionsRow label="Countdown to alarm" subLabel="Badge shows time to next alarm">
          <Toggle checked={countdown} onChange={setCountdown} />
        </OptionsRow> */}

        <div className="flex items-center justify-center mb-2" style={{ marginTop: 'auto' }}>
          <Button onClick={onCancel} outline>
            Cancel
          </Button>
          <Button onClick={onSave} className="ml-4">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
type TRowProps = {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly subLabel?: string;
};
// ---------------------------------------------------------------------------------
function OptionsRow({ children, label, subLabel }: TRowProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1">
      <div className="flex flex-row w-3/5">
        <label className="italic font-bold text-gray-700 dark:text-gray-400">{label}</label>
        {subLabel && (
          <div className="group cursor-pointer relative">
            <QuestionIcon className="w-4 h-4 ml-1 dark:text-gray-400" />
            <div className="absolute w-28 opacity-0 bg-black text-white text-center text-xs rounded-lg p-1 z-10 group-hover:opacity-100 bottom-full -left-1/2 pointer-events-none">
              {subLabel}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end flex-auto w-2/5">{children}</div>
    </div>
  );
}
// ---------------------------------------------------------------------------------
function Divider() {
  return <div className="w-1/2 h-px bg-gray-200 dark:bg-gray-700" />;
}
