import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { TimeInput } from '../components/TimeInput';
import { calculateMinutes, formatMinutesToHours } from '../services/utils';
import { AttendanceRecord, User } from '../types';
import { AlertCircle, CheckCircle, Edit3 } from 'lucide-react';

interface AttendanceInputProps {
  user: User;
  onSave: (record: AttendanceRecord) => void;
  attendanceRecords: AttendanceRecord[];
  isAdmin?: boolean;
}

export const AttendanceInput: React.FC<AttendanceInputProps> = ({ user, onSave, attendanceRecords, isAdmin = false }) => {
  // State
  const [date, setDate] = useState('');
  const [amIn, setAmIn] = useState('');
  const [amOut, setAmOut] = useState('');
  const [pmIn, setPmIn] = useState('');
  const [pmOut, setPmOut] = useState('');
  const [undertime, setUndertime] = useState(0);
  const [amRemarks, setAmRemarks] = useState('');
  const [pmRemarks, setPmRemarks] = useState('');
  const [remarks, setRemarks] = useState('');
  const [remarksHours, setRemarksHours] = useState<number | undefined>(undefined);
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);

  // Check for existing records when date changes
  useEffect(() => {
    if (date) {
      const record = attendanceRecords.find(r => r.date === date);
      setExistingRecord(record || null);
      
      // If record exists, populate fields
      if (record) {
          setAmIn(record.amIn);
          setAmOut(record.amOut);
          setPmIn(record.pmIn);
          setPmOut(record.pmOut);
          setUndertime(record.undertimeMinutes);
          setRemarks(record.remarks || '');
          setRemarksHours(record.remarksHours);
          setAmRemarks(record.amRemarks || '');
          setPmRemarks(record.pmRemarks || '');
      } else {
          // Reset fields if no record
          setAmIn('');
          setAmOut('');
          setPmIn('');
          setPmOut('');
          setUndertime(0);
          setRemarks('');
          setRemarksHours(undefined);
          setAmRemarks('');
          setPmRemarks('');
      }
    } else {
        setExistingRecord(null);
        setAmIn('');
        setAmOut('');
        setPmIn('');
        setPmOut('');
        setUndertime(0);
        setRemarks('');
        setRemarksHours(undefined);
        setAmRemarks('');
        setPmRemarks('');
    }
  }, [date]); // Only populate fields when date changes

  // Keep existingRecord in sync with attendanceRecords without overwriting input fields
  useEffect(() => {
    if (date) {
      const record = attendanceRecords.find(r => r.date === date);
      setExistingRecord(record || null);
    }
  }, [attendanceRecords, date]);

  // Calculations
  const amMinutes = calculateMinutes(amIn, amOut);
  const pmMinutes = calculateMinutes(pmIn, pmOut);
  const totalRaw = amMinutes + pmMinutes;
  let totalNet = Math.max(0, totalRaw - undertime);
  if (remarksHours && remarksHours > 0) {
      totalNet += (remarksHours * 60);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no date selected
    if (!date) return;
    
    // If Creating new record: Require at least one time entry or undertime or remarks
    if (!existingRecord && !amIn && !amOut && !pmIn && !pmOut && undertime === 0 && !remarks && !amRemarks && !pmRemarks && !remarksHours) {
        return;
    }

    // Determine if we should merge columns (if no time logs but has remarks)
    const hasTimeLogs = !!(amIn || amOut || pmIn || pmOut);
    const shouldMerge = !hasTimeLogs && !!remarks && !amRemarks && !pmRemarks;

    const record: AttendanceRecord = {
      id: existingRecord?.id || Date.now().toString(),
      userId: user.id,
      date,
      // Use form state directly if admin or new record
      amIn,
      amOut,
      pmIn,
      pmOut,
      undertimeMinutes: undertime,
      totalDailyMinutes: totalNet,
      isLocked: true, // Always lock upon save
      isPmDepartureLocked: existingRecord?.isPmDepartureLocked || false,
      remarks: remarks, 
      remarksHours: remarksHours,
      amRemarks: amRemarks,
      pmRemarks: pmRemarks,
      isMerged: existingRecord?.isMerged || shouldMerge
    };
    
    onSave(record);
    // Force local state update to lock UI immediately after save (unless admin)
    setExistingRecord(record);
  };

  // Lock if record exists AND not admin
  const isLocked = !!existingRecord && !isAdmin;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">Input Past Time</h2>
        <p className="text-sm text-gray-500">Record attendance for previous dates.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Date Selection */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            {existingRecord && !isAdmin && (
                <div className="mt-3 flex items-start text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Time logs are locked for this date.</span>
                </div>
            )}
            {existingRecord && isAdmin && (
                <div className="mt-3 flex items-start text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <Edit3 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Editing existing record as Admin.</span>
                </div>
            )}
            {!date && (
                <div className="mt-2 text-xs text-gray-500">
                    Please select a date to begin logging.
                </div>
            )}
        </div>

        <div className={`transition-opacity duration-200 ${!date ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AM Session */}
            <div className={`space-y-4 p-4 rounded-lg border ${isLocked ? 'bg-gray-100 border-gray-200' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex justify-between items-center">
                    <h3 className={`font-semibold ${isLocked ? 'text-gray-500' : 'text-blue-900'}`}>AM Session</h3>
                    {!isLocked && (
                        <button 
                            type="button"
                            onClick={() => setAmRemarks('HALF DAY')}
                            className="text-[10px] bg-white text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 font-medium"
                        >
                            Mark Half Day
                        </button>
                    )}
                </div>
                <TimeInput 
                    label="Arrival (AM In)" 
                    value={amIn} 
                    onChange={setAmIn}
                    disabled={isLocked}
                />
                <TimeInput 
                    label="Departure (AM Out)" 
                    value={amOut} 
                    onChange={setAmOut}
                    disabled={isLocked}
                />
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">AM Remarks</label>
                    <input 
                        type="text" 
                        value={amRemarks}
                        onChange={e => setAmRemarks(e.target.value)}
                        disabled={isLocked}
                        placeholder="e.g. Half Day"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
                {!isLocked && (
                    <div className="text-right text-sm text-blue-700 font-medium">
                        Hours: {formatMinutesToHours(amMinutes)}
                    </div>
                )}
            </div>

            {/* PM Session */}
            <div className={`space-y-4 p-4 rounded-lg border ${isLocked ? 'bg-gray-100 border-gray-200' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex justify-between items-center">
                    <h3 className={`font-semibold ${isLocked ? 'text-gray-500' : 'text-orange-900'}`}>PM Session</h3>
                    {!isLocked && (
                        <button 
                            type="button"
                            onClick={() => setPmRemarks('HALF DAY')}
                            className="text-[10px] bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-200 hover:bg-orange-50 font-medium"
                        >
                            Mark Half Day
                        </button>
                    )}
                </div>
                <TimeInput 
                    label="Arrival (PM In)" 
                    value={pmIn} 
                    onChange={setPmIn}
                    disabled={isLocked}
                />
                <TimeInput 
                    label="Departure (PM Out)" 
                    value={pmOut} 
                    onChange={setPmOut}
                    disabled={isLocked}
                />
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">PM Remarks</label>
                    <input 
                        type="text" 
                        value={pmRemarks}
                        onChange={e => setPmRemarks(e.target.value)}
                        disabled={isLocked}
                        placeholder="e.g. Half Day"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
                 {!isLocked && (
                    <div className="text-right text-sm text-orange-700 font-medium">
                        Hours: {formatMinutesToHours(pmMinutes)}
                    </div>
                )}
            </div>
            </div>

            {/* Undertime */}
            <div className={`p-4 rounded-lg border mt-6 ${isLocked ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>Deductions & Remarks</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Undertime (Minutes)</label>
                    <input 
                        type="number" 
                        min="0"
                        value={undertime}
                        onChange={e => setUndertime(parseInt(e.target.value) || 0)}
                        disabled={isLocked}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea 
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        disabled={isLocked}
                        placeholder="e.g., Holiday, Work Suspension, Official Business"
                        rows={3}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-500 resize-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks Hours (Optional)</label>
                    <input 
                        type="number" 
                        min="0"
                        max="24"
                        step="0.5"
                        value={remarksHours || ''}
                        onChange={e => setRemarksHours(e.target.value ? Number(e.target.value) : undefined)}
                        disabled={isLocked}
                        placeholder="e.g. 8"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
            </div>
            </div>

            {/* Totals */}
            {!isLocked && (
                <div className="flex items-center justify-between p-4 bg-brand-50 border border-brand-200 rounded-lg mt-6">
                <span className="text-brand-900 font-medium">Total Daily Hours</span>
                <span className="text-2xl font-bold text-brand-700">{formatMinutesToHours(totalNet)}</span>
                </div>
            )}

            <div className="pt-4">
                {isLocked ? (
                   // Hiding save button when locked since there's nothing to edit (Remarks removed)
                   <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded">
                       Record is locked. Contact admin for corrections.
                   </div>
                ) : (
                    <Button type="submit" size="lg" fullWidth>
                        Save Record
                    </Button>
                )}
            </div>
        </div>
      </form>
    </div>
  );
};