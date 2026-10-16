import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, StickyNote, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateForInput, monthNames, getDaysInMonth, getFirstDayOfMonth } from '../../services/utils';

export interface PublicCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
}

export const PublicCalendarModal: React.FC<PublicCalendarModalProps> = ({ isOpen, onClose, username }) => {
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [offlineNotes, setOfflineNotes] = useState<any[]>([]);
    
    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();

    useEffect(() => {
        if (isOpen) {
            const loadNotes = () => {
                const notesStr = localStorage.getItem('employee_notes');
                if (notesStr) {
                    const allNotes = JSON.parse(notesStr);
                    // Filter for this username
                    setOfflineNotes(allNotes.filter((n: any) => n.username === username));
                } else {
                    setOfflineNotes([]);
                }
            };
            loadNotes();
        }
    }, [isOpen, username]);

    if (!isOpen) return null;

    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);

    // Days grid preparation
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-brand-50">
                    <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-5 h-5 text-brand-600" />
                        <h3 className="font-semibold text-gray-800">
                            Employee Schedule & Public Notes: <span className="text-brand-600">@{username}</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Calendar Controls */}
                <div className="p-4 flex justify-between items-center bg-white border-b border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800">
                        {monthNames[month]} {year}
                    </h4>
                    <div className="flex space-x-2">
                        <button 
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-gray-500 mb-2">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            if (!day) {
                                return <div key={`empty-${idx}`} className="h-24 bg-gray-50/50 rounded-lg border border-dashed border-gray-100" />;
                            }

                            const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const notesForDay = offlineNotes.filter(n => n.dates && n.dates.includes(currentDateStr));
                            const isToday = formatDateForInput(new Date()) === currentDateStr;

                            return (
                                <div 
                                    key={`day-${day}`}
                                    className={`h-24 p-1.5 rounded-lg border flex flex-col justify-between overflow-hidden text-left transition-all ${
                                        isToday ? 'border-brand-500 bg-brand-50/20' : 'border-gray-100 bg-white hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-semibold ${isToday ? 'text-brand-600 font-bold' : 'text-gray-700'}`}>
                                            {day}
                                        </span>
                                        {notesForDay.length > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                        )}
                                    </div>

                                    {/* Notes display */}
                                    <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5 no-scrollbar">
                                        {notesForDay.map((note, nIdx) => (
                                            <div 
                                                key={nIdx}
                                                style={{ backgroundColor: note.noteColor || '#fef3c7' }}
                                                className="text-[10px] p-1 rounded border border-black/5 shadow-xs leading-tight text-gray-800 break-words"
                                                title={`${note.noteRemark ? `[${note.noteRemark}] ` : ''}${note.noteText}`}
                                            >
                                                {note.noteRemark && (
                                                    <span className="font-bold block truncate opacity-75">
                                                        {note.noteRemark}
                                                    </span>
                                                )}
                                                <span className="line-clamp-2">{note.noteText}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Notes List / Legend */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                        <StickyNote size={14} className="text-amber-500" />
                        <span>Public administrative notifications posted by employee</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
