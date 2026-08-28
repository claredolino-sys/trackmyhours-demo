import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, StickyNote, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateForInput, monthNames, getDaysInMonth, getFirstDayOfMonth } from '../services/utils';

interface PublicCalendarModalProps {
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
                }
            };
            loadNotes();
        }
    }, [isOpen, username]);

    if (!isOpen) return null;

    const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) daysArray.push(null);
    for (let i = 1; i <= daysInMonth; i++) daysArray.push(new Date(year, month, i));

    const getNoteForDate = (dateStr: string) => {
        // Handle both old format (date: string) and new format (dates: string[])
        return offlineNotes.find(n => n.date === dateStr || (n.dates && n.dates.includes(dateStr)));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-brand-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Public Calendar View</h2>
                            <p className="text-brand-100 text-sm">Viewing notes for: <span className="font-semibold">{username}</span></p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Calendar Controls */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 border border-transparent hover:border-gray-200">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-gray-800 min-w-[140px] text-center text-lg">
                            {monthNames[month]} {year}
                        </span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 border border-transparent hover:border-gray-200">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                            <span>Has Note</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">{day}</div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                        {daysArray.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} className="aspect-square sm:aspect-auto sm:min-h-[100px] bg-gray-50/50 rounded-xl"></div>;
                            
                            const dateStr = formatDateForInput(date);
                            const note = getNoteForDate(dateStr);
                            const isToday = formatDateForInput(new Date()) === dateStr;
                            
                            const isMerged = note && note.dates && note.dates.length > 1;
                            let mergeClass = "";
                            let hasPrev = false;
                            let isPrevInSameWeek = false;
                            
                            if (isMerged) {
                                const sortedDates = [...note.dates].sort();
                                const dateIndex = sortedDates.indexOf(dateStr);
                                
                                const prevDate = new Date(date);
                                prevDate.setDate(prevDate.getDate() - 1);
                                const nextDate = new Date(date);
                                nextDate.setDate(nextDate.getDate() + 1);
                                
                                isPrevInSameWeek = date.getDay() !== 0; // Not Sunday
                                const isNextInSameWeek = date.getDay() !== 6; // Not Saturday
                                
                                hasPrev = dateIndex > 0 && sortedDates[dateIndex-1] === formatDateForInput(prevDate);
                                const hasNext = dateIndex < sortedDates.length - 1 && sortedDates[dateIndex+1] === formatDateForInput(nextDate);

                                if (hasPrev && hasNext && isPrevInSameWeek && isNextInSameWeek) {
                                    mergeClass = "rounded-none border-x-0 mx-[-4px] sm:mx-[-8px] md:mx-[-16px]";
                                } else if (hasPrev && isPrevInSameWeek) {
                                    mergeClass = "rounded-l-none border-l-0 ml-[-4px] sm:ml-[-8px] md:ml-[-16px]";
                                } else if (hasNext && isNextInSameWeek) {
                                    mergeClass = "rounded-r-none border-r-0 mr-[-4px] sm:mr-[-8px] md:mr-[-16px]";
                                }
                            }

                            const showText = !isMerged || !hasPrev || !isPrevInSameWeek;

                            return (
                                <div 
                                    key={dateStr}
                                    className={`relative aspect-square sm:aspect-auto sm:min-h-[100px] p-2 rounded-xl border transition-all flex flex-col ${
                                        isToday ? 'border-brand-500 bg-brand-50/30' : 'border-gray-100 bg-white'
                                    }`}
                                >
                                    <span className={`text-sm font-bold ${isToday ? 'text-brand-600' : 'text-gray-700'}`}>
                                        {date.getDate()}
                                    </span>
                                    
                                    {note && (
                                        <div className={`mt-1 flex-1 rounded-lg p-1.5 text-[10px] leading-tight text-white overflow-hidden shadow-sm min-h-[18px] flex flex-col justify-center ${note.color || 'bg-brand-500'} ${mergeClass}`}>
                                            {showText && (
                                                <>
                                                    {note.remark && <div className="font-bold uppercase text-[8px] mb-0.5 opacity-90">[{note.remark}]</div>}
                                                    <div className="line-clamp-3 sm:line-clamp-4">{note.text}</div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-md"
                    >
                        Close Calendar
                    </button>
                </div>
            </div>
        </div>
    );
};
