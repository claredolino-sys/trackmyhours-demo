import React, { useState, useEffect } from 'react';
import { formatTime12Hour, parseTime } from '../services/utils';

interface TimeInputProps {
  label: string;
  value: string; // HH:mm (24-hour)
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange, disabled, error }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatTime12Hour(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleBlur = () => {
    const parsed = parseTime(displayValue);
    if (parsed) {
      onChange(parsed);
      setDisplayValue(formatTime12Hour(parsed));
    } else if (displayValue.trim() === '') {
        onChange('');
        setDisplayValue('');
    } else {
        // Invalid input, maybe revert or keep as is?
        // Let's try to parse again strictly or just revert to previous valid value if possible
        // For now, let's just keep what user typed but it won't update parent state if invalid
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="08:00 AM"
        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-500 ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
