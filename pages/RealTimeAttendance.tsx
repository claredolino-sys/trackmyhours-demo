import React, { useState, useEffect, useRef } from 'react';
import { User, AttendanceRecord, UserRole, AppNotification } from '../types';
import { calculateMinutes, formatDateForInput, formatTime12Hour } from '../services/utils';
import { Clock, LogIn, LogOut, Calendar, Sun, Moon, MapPin, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface RealTimeAttendanceProps {
  user: User;
  onSave: (record: AttendanceRecord, location?: { lat: number; lng: number }) => void;
  existingRecord?: AttendanceRecord;
}

export const RealTimeAttendance: React.FC<RealTimeAttendanceProps> = ({ user, onSave, existingRecord }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWarning, setShowWarning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [optimisticRecord, setOptimisticRecord] = useState<AttendanceRecord | undefined>(existingRecord);

  useEffect(() => {
    setOptimisticRecord(prev => {
        if (!prev) return existingRecord;
        if (!existingRecord) return prev;
        
        // If the date changed (e.g., midnight passed), use the new record
        if (prev.date !== existingRecord.date) return existingRecord;

        // Merge to prevent stale existingRecord from overwriting optimistic updates
        return {
            ...existingRecord,
            amIn: prev.amIn || existingRecord.amIn,
            amOut: prev.amOut || existingRecord.amOut,
            pmIn: prev.pmIn || existingRecord.pmIn,
            pmOut: prev.pmOut || existingRecord.pmOut,
            amRemarks: prev.amRemarks || existingRecord.amRemarks,
            pmRemarks: prev.pmRemarks || existingRecord.pmRemarks,
        };
    });
  }, [existingRecord]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Celebration Logic
  useEffect(() => {
    if (user.role === UserRole.STUDENT) {
      const req = user.profile.requiredHours || 0;
      const completed = user.profile.completedHours || 0;
      if (req > 0 && completed >= req * 60) {
        const hasSeen = sessionStorage.getItem(`celebration_${user.id}`);
        if (!hasSeen) {
          setShowCelebration(true);
          sessionStorage.setItem(`celebration_${user.id}`, 'true');
        }
      }
    }
  }, [user]);

  const isStudentOrEmployee = user.role === UserRole.STUDENT || user.role === UserRole.EMPLOYEE;
  const isPastOnePM = isStudentOrEmployee && currentTime.getHours() >= 13;
  const isBeforeNoon = isStudentOrEmployee && currentTime.getHours() < 12;

  const handleClockAction = (field: 'amIn' | 'amOut' | 'pmIn' | 'pmOut') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = formatDateForInput(now);

    const baseRecord: AttendanceRecord = optimisticRecord || {
        id: Date.now().toString(),
        userId: user.id,
        date: todayStr,
        amIn: '',
        amOut: '',
        pmIn: '',
        pmOut: '',
        undertimeMinutes: 0,
        totalDailyMinutes: 0,
        isLocked: false,
        isPmDepartureLocked: false,
        remarks: '',
        isMerged: false
    };

    const newRecord = { ...baseRecord, [field]: timeStr };
    
    // Recalculate totals
    const amMinutes = calculateMinutes(newRecord.amIn, newRecord.amOut);
    const pmMinutes = calculateMinutes(newRecord.pmIn, newRecord.pmOut);
    const totalNet = Math.max(0, amMinutes + pmMinutes - newRecord.undertimeMinutes);
    
    newRecord.totalDailyMinutes = totalNet;
    newRecord.isLocked = !!(newRecord.amIn && newRecord.amOut && newRecord.pmIn && newRecord.pmOut);
    
    // Update local state instantly for fast feedback
    setOptimisticRecord(newRecord);
    
    // Capture location before saving
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onSave(newRecord, { lat: latitude, lng: longitude });
            },
            (error) => {
                console.error("Error getting location for clock action:", error);
                // Fallback: save without specific location (App.tsx might use stale location or none)
                onSave(newRecord);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        onSave(newRecord);
    }
  };

  const handleMarkHalfDay = (session: 'AM' | 'PM') => {
    const now = new Date();
    const todayStr = formatDateForInput(now);

    const baseRecord: AttendanceRecord = optimisticRecord || {
        id: Date.now().toString(),
        userId: user.id,
        date: todayStr,
        amIn: '',
        amOut: '',
        pmIn: '',
        pmOut: '',
        undertimeMinutes: 0,
        totalDailyMinutes: 0,
        isLocked: false,
        isPmDepartureLocked: false,
        remarks: '',
        isMerged: false
    };

    const newRecord = { ...baseRecord };
    if (session === 'AM') {
        newRecord.amRemarks = 'HALF DAY';
    } else {
        newRecord.pmRemarks = 'HALF DAY';
    }
    
    // Recalculate totals
    const amMinutes = calculateMinutes(newRecord.amIn, newRecord.amOut);
    const pmMinutes = calculateMinutes(newRecord.pmIn, newRecord.pmOut);
    const totalNet = Math.max(0, amMinutes + pmMinutes - newRecord.undertimeMinutes);
    
    newRecord.totalDailyMinutes = totalNet;
    
    setOptimisticRecord(newRecord);
    onSave(newRecord);
  };

  const getTimeDisplay = (time24: string) => {
      if (!time24) return '--:--';
      return formatTime12Hour(time24);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
        <div className="text-center py-8 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl shadow-lg text-white px-4">
            <h2 className="text-xl md:text-2xl font-medium opacity-90">Current Time</h2>
            <div className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight my-4 font-mono break-all sm:break-normal">
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-brand-100">
                <Calendar className="w-5 h-5 hidden sm:block" />
                <span className="text-sm sm:text-lg">{currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AM Session */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center">
                    <Sun className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Morning Session (AM)</h3>
                        <p className="text-xs text-gray-500">Arrival & Departure</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
                    <div className="flex flex-col space-y-3">
                        <div className="text-sm font-medium text-gray-500">Time In</div>
                        <div className={`text-2xl font-bold ${optimisticRecord?.amIn ? 'text-gray-900' : 'text-gray-300'}`}>
                            {getTimeDisplay(optimisticRecord?.amIn || '')}
                        </div>
                        <button 
                            onClick={() => handleClockAction('amIn')}
                            disabled={!!optimisticRecord?.amIn || !!optimisticRecord?.amRemarks || isPastOnePM}
                            className={`flex items-center justify-center py-2 px-4 rounded-lg font-medium transition-colors ${
                                optimisticRecord?.amIn || !!optimisticRecord?.amRemarks || isPastOnePM
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:transform active:scale-95'
                            }`}
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            Clock In
                        </button>
                    </div>

                    <div className="flex flex-col space-y-3 border-t border-gray-100 pt-6 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
                        <div className="text-sm font-medium text-gray-500">Time Out</div>
                        <div className={`text-2xl font-bold ${optimisticRecord?.amOut ? 'text-gray-900' : 'text-gray-300'}`}>
                            {getTimeDisplay(optimisticRecord?.amOut || '')}
                        </div>
                        <button 
                            onClick={() => {
                                if (isBeforeNoon) {
                                    setShowWarning(true);
                                } else {
                                    handleClockAction('amOut');
                                }
                            }}
                            disabled={!!optimisticRecord?.amOut || !optimisticRecord?.amIn || !!optimisticRecord?.amRemarks || isPastOnePM}
                            className={`flex items-center justify-center py-2 px-4 rounded-lg font-medium transition-colors ${
                                optimisticRecord?.amOut || !optimisticRecord?.amIn || !!optimisticRecord?.amRemarks || isPastOnePM
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:transform active:scale-95'
                            }`}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Clock Out
                        </button>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={() => handleMarkHalfDay('AM')}
                        disabled={!!optimisticRecord?.amRemarks || !!optimisticRecord?.amIn}
                        className="text-sm text-blue-600 font-medium hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {optimisticRecord?.amRemarks === 'HALF DAY' ? 'Marked as Half Day' : 'Mark AM as Half Day'}
                    </button>
                </div>
            </div>

            {/* PM Session */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center">
                    <Moon className="w-6 h-6 text-orange-600 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Afternoon Session (PM)</h3>
                        <p className="text-xs text-gray-500">Arrival & Departure</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
                    <div className="flex flex-col space-y-3">
                        <div className="text-sm font-medium text-gray-500">Time In</div>
                        <div className={`text-2xl font-bold ${optimisticRecord?.pmIn ? 'text-gray-900' : 'text-gray-300'}`}>
                            {getTimeDisplay(optimisticRecord?.pmIn || '')}
                        </div>
                        <button 
                            onClick={() => handleClockAction('pmIn')}
                            disabled={!!optimisticRecord?.pmIn || !!optimisticRecord?.pmRemarks}
                            className={`flex items-center justify-center py-2 px-4 rounded-lg font-medium transition-colors ${
                                optimisticRecord?.pmIn || !!optimisticRecord?.pmRemarks
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm active:transform active:scale-95'
                            }`}
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            Clock In
                        </button>
                    </div>

                    <div className="flex flex-col space-y-3 border-t border-gray-100 pt-6 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
                        <div className="text-sm font-medium text-gray-500">Time Out</div>
                        <div className={`text-2xl font-bold ${optimisticRecord?.pmOut ? 'text-gray-900' : 'text-gray-300'}`}>
                            {getTimeDisplay(optimisticRecord?.pmOut || '')}
                        </div>
                        <button 
                            onClick={() => handleClockAction('pmOut')}
                            disabled={!!optimisticRecord?.pmOut || !optimisticRecord?.pmIn || !!optimisticRecord?.pmRemarks || optimisticRecord?.isPmDepartureLocked}
                            className={`flex items-center justify-center py-2 px-4 rounded-lg font-medium transition-colors ${
                                optimisticRecord?.pmOut || !optimisticRecord?.pmIn || !!optimisticRecord?.pmRemarks || optimisticRecord?.isPmDepartureLocked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm active:transform active:scale-95'
                            }`}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            {optimisticRecord?.isPmDepartureLocked ? 'Departure Locked' : 'Clock Out'}
                        </button>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={() => handleMarkHalfDay('PM')}
                        disabled={!!optimisticRecord?.pmRemarks || !!optimisticRecord?.pmIn}
                        className="text-sm text-orange-600 font-medium hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {optimisticRecord?.pmRemarks === 'HALF DAY' ? 'Marked as Half Day' : 'Mark PM as Half Day'}
                    </button>
                </div>
            </div>
        </div>

        {/* Summary Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center text-sm text-gray-600 text-center">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Updates made here are automatically reflected in your Daily Time Record.</span>
        </div>

        {/* Warning Popup */}
        {showWarning && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4 mx-auto">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Just a heads-up!</h3>
                    <p className="text-gray-600 text-center mb-6">
                        The morning session Clock Out button won't be available until 12:00 PM.
                    </p>
                    <button 
                        onClick={() => setShowWarning(false)}
                        className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
                    >
                        Got it
                    </button>
                </div>
            </div>
        )}

        {/* Celebration Modal */}
        {showCelebration && user.role === UserRole.STUDENT && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-fade-in text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
                    <p className="text-gray-600 mb-8">
                        {user.profile.studentType === 'IMMERSION' 
                            ? "Hooray! You have already completed your Work Immersion hours."
                            : "Hooray! You have already completed your OJT hours."}
                    </p>
                    <button 
                        onClick={() => setShowCelebration(false)}
                        className="w-full bg-brand-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-700 transition-colors"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};