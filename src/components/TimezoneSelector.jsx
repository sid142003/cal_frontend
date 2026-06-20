import React from 'react';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT+1)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+2)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST, GMT+5:30)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT, GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST, GMT+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST, GMT+10)' }
];

export default function TimezoneSelector({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Viewing Timezone</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900 border border-white/10 text-slate-100 hover:border-slate-700 focus:outline-none transition cursor-pointer appearance-none"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value} className="bg-slate-950 text-slate-100">
              {tz.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
