import React from 'react';

export default function Footer() {
  return (
    <div className="flex justify-between p-1 pt-0 border-t border-cyan">
      <span
        onClick={() => chrome.runtime.openOptionsPage?.()}
        className="cursor-pointer text-cyan hover:brightness-50 focus:ring-2 focus:ring-cyan focus:ring-opacity-50"
      >
        Options
      </span>
    </div>
  );
}
