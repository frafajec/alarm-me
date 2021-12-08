import React from 'react';
import { pad } from '@src/utils';
import { useAppSelector } from '@src/popup/store';
import { dateFormats } from '@src/typings';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly date: Date;
  readonly setDate: (date: Date) => void;
};

// ---------------------------------------------------------------------------------
export default function Datum({ date, setDate }: TProps) {
  const [day, setDay] = React.useState(pad(date.getDate()));
  const [month, setMonth] = React.useState(pad(date.getMonth() + 1));
  const [year, setYear] = React.useState(pad(date.getFullYear()));

  const [delimiter, setDelimiter] = React.useState('.');
  const [shortYear, setShortYear] = React.useState(false);
  const [gridTemplateAreas, setGridTemplateAreas] = React.useState(
    '"day delimit1 month delimit2 year"'
  );
  const dateFormatIndex = useAppSelector(s => s.options.dateFormat);

  React.useEffect(() => {
    setDay(pad(date.getDate()));
    setMonth(pad(date.getMonth() + 1));
    setYear(pad(date.getFullYear()));
  }, [date]);

  React.useEffect(() => {
    const dateFormat = dateFormats[dateFormatIndex];

    switch (dateFormat) {
      case 'DD.MM.YY':
        setDelimiter('.');
        setShortYear(true);
        setGridTemplateAreas('"day delimit1 month delimit1 year"');
        break;
      case 'MM-DD-YYYY':
        setDelimiter('-');
        setShortYear(false);
        setGridTemplateAreas('"month delimit1 day delimit1 year"');
        break;
      case 'DD/MM/YYYY':
        setDelimiter('/');
        setShortYear(false);
        setGridTemplateAreas('"day delimit1 month delimit1 year"');
        break;
      case 'YYYY/MM/DD':
        setDelimiter('/');
        setShortYear(false);
        setGridTemplateAreas('"year delimit1 month delimit1 day"');
        break;
      default:
        //case "DD.MM.YYYY":
        setDelimiter('.');
        setShortYear(false);
        setGridTemplateAreas('"day delimit1 month delimit1 year"');
    }
  }, [dateFormatIndex]);

  // day
  const onScrollDay: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = date.getDate();
    value += e.deltaY > 0 ? 1 : -1;
    const newDate = date.setDate(value);
    setDate(new Date(newDate));
  };
  const onChangeDay = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    setDay(pad(newValue));
  };
  const onBlurDay = (e: React.FocusEvent<HTMLInputElement>) => {
    const lastDayInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let newValue = Math.max(Math.min(lastDayInMonth.getDate(), parseInt(e.target.value)), 1);
    let newDate = date.setDate(newValue);
    setDate(new Date(newDate));
  };

  // month
  const onScrollMonth: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = date.getMonth();
    value += e.deltaY > 0 ? 1 : -1;
    const newDate = date.setMonth(value);
    setDate(new Date(newDate));
  };
  const onChangeMonth = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    setMonth(pad(newValue));
  };
  const onBlurMonth = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue = Math.max(Math.min(12, parseInt(e.target.value)), 1);
    let newDate = date.setMonth(newValue - 1);
    setDate(new Date(newDate));
  };

  // year
  const onScrollYear: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = date.getFullYear();
    value += e.deltaY > 0 ? 1 : -1;
    const newDate = date.setFullYear(value);
    setDate(new Date(newDate));
  };
  const onChangeYear = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    setYear(pad(newValue));
  };
  const onBlurYear = (e: React.FocusEvent<HTMLInputElement>) => {
    let today = new Date();
    let newValue = Math.max(
      Math.min(today.getFullYear() + 5, parseInt(e.target.value)),
      today.getFullYear()
    );
    let newDate = date.setFullYear(newValue);
    setDate(new Date(newDate));
  };

  return (
    <div
      className="inline-grid border border-t-0 border-gray-300 rounded text-lg -mt-1.5 dark:border-gray-500 dark:text-gray-400"
      style={{ gridTemplateAreas, padding: shortYear ? '0 16px' : '0 4px' }}
    >
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: '2ch', gridArea: 'day' }}
        value={day}
        onWheel={onScrollDay}
        onChange={onChangeDay}
        onBlur={onBlurDay}
      />
      <p style={{ gridArea: 'delimit1' }}>{delimiter}</p>
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: '2ch', gridArea: 'month' }}
        value={month}
        onWheel={onScrollMonth}
        onChange={onChangeMonth}
        onBlur={onBlurMonth}
      />
      <p style={{ gridArea: 'delimit2' }}>{delimiter}</p>
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: shortYear ? '2ch' : '4ch', gridArea: 'year' }}
        value={shortYear ? year.slice(2, 4) : year}
        onWheel={onScrollYear}
        onChange={onChangeYear}
        onBlur={onBlurYear}
      />
    </div>
  );
}
