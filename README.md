## Synopsis

Chrome extension app that enables users to use "pocket" alarm on the run. It provides basic functionality for creating and handling alarm, providing few options to alter alarms behavior and notifies user via chrome notifications when alarm is due.

## Motivation

Project was created out of personal need of an author and is and will remain free. Idea was that whenever user uses chrome for fun or work, he can always have easy access to alarm.

## Installation

As easy as it gets! App is on Chrome WebStore so it is 2-click install from this [link](https://chrome.google.com/webstore/detail/alarm-me/knahjdfbilnkfipggnnhojmjpjcgjkmg "Alarm Me!").

## API Reference

API is entirely on Chrome browser platform, however some additional libraries are used to enhance app itself. Link to API reference [here](https://developer.chrome.com/extensions "Chrome extensions").

## Versions

**1.0.0** Initial version with basic alarm triggering, options and notifications

**1.1.0** Added repetitive alarms

**1.2.0** Fix when alarm triggers but notification is not raised; added possibility to shut down alarm from popup UI

**1.3.0** Added locales, reduced permissions, added sounds, edit/inactive alarms, UI rework

**1.3.1** Calendar overflow bugfix

**1.4.0** Added time format for app

**1.4.1** Bugfix for date format

**1.4.2** Fallback scenarios for time and date formats

**1.4.3-4** Options self invocation and popup wait for loading options

**1.4.5** Added new format option for date

**1.5.0** Badge countdown, font changed to Lato, notification rework, general UI fixes

**2.0.0** Complete rework of the extension

## License

MIT License

Copyright (c) 2016 Filip Rafajec

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
