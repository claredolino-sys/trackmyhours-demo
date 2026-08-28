import React, { useState } from 'react';
import { User, AttendanceRecord } from '../types';
import { formatMinutesToHours, formatDateForInput, addMinutesToTime, formatTime12Hour } from '../services/utils';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Sun,
  Moon,
  ArrowRight,
  Briefcase,
  Plus,
  X,
  Trash2,
  StickyNote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

interface EmployeeDashboardProps {
  user: User;
  attendance: AttendanceRecord[];
  onSave?: (records: AttendanceRecord[]) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, attendance, onSave }) => {
  // Stats Logic - For Employees, we track monthly or total stats instead of specific OJT requirements
  const totalCompletedMinutes = attendance.reduce((acc, curr) => acc + curr.totalDailyMinutes, 0);
  
  // Calculate stats for current month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const isRecordPresent = (r: AttendanceRecord) => {
      return !!(r.amIn || r.amOut || r.pmIn || r.pmOut || (r.remarksHours && r.remarksHours > 0));
  };

  const currentMonthRecords = attendance.filter(r => r.date.startsWith(currentMonthStr));
  const monthMinutes = currentMonthRecords.reduce((acc, curr) => acc + curr.totalDailyMinutes, 0);
  const daysPresentMonth = currentMonthRecords.filter(isRecordPresent).length;

  // Time Prediction & Today's Activity Logic
  const todayDate = new Date();
  const todayStr = formatDateForInput(todayDate);
  const todayRecord = attendance.find(r => r.date === todayStr);
  
  const formatTime = (time: string) => time ? formatTime12Hour(time) : '--:--';
  const hasTime = (time: string) => !!time && time.length > 0;
  
  let predictionMsg = "";
  if (todayRecord && todayRecord.amIn && !todayRecord.pmOut) {
      // Assuming 8 hour shift + 1 hour break
      const targetTime24 = addMinutesToTime(todayRecord.amIn, 540); 
      predictionMsg = `Based on your ${formatTime12Hour(todayRecord.amIn)} arrival, your 9-hour day (including lunch) ends around ${formatTime12Hour(targetTime24)}.`;
  } else if (!todayRecord) {
      predictionMsg = "Don't forget to log your AM Arrival to get started today.";
  } else {
      predictionMsg = "Have a great rest of your day!";
  }

  // Calendar Logic
  const [calendarDate, setCalendarDate] = useState(new Date());
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  const daysArray = [];
  for(let i=0; i<firstDayOfMonth; i++) {
      daysArray.push(null);
  }
  for(let i=1; i<=daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
  }

  const getDayStatus = (date: Date) => {
      const dateStr = formatDateForInput(date);
      const record = attendance.find(r => r.date === dateStr);
      const isPresent = record ? isRecordPresent(record) : false;
      
      if (isPresent) return 'present';
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let isAfterStart = true;
      if (user.profile.dateStarted) {
          const startDate = new Date(user.profile.dateStarted);
          startDate.setHours(0,0,0,0);
          isAfterStart = date >= startDate;
      }
      
      if (isPast && !isWeekend && isAfterStart) return 'absent';
      return 'neutral';
  };

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  // Calendar Notes Logic
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteRemark, setNoteRemark] = useState<'Did not Attend' | 'Cancelled' | 'Postponed' | ''>('');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('bg-blue-500');
  const [noteDateInput, setNoteDateInput] = useState('');
  const [noteEndDateInput, setNoteEndDateInput] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Load offline notes from localStorage
  const [offlineNotes, setOfflineNotes] = useState<any[]>([]);
  
  React.useEffect(() => {
      const loadOfflineNotes = () => {
          try {
              const notesStr = localStorage.getItem('employee_notes');
              if (notesStr) {
                  const notes = JSON.parse(notesStr);
                  // Filter notes for current user
                  setOfflineNotes(notes.filter((n: any) => n.userId === user.id || n.username === user.profile.username));
              }
          } catch (e) {
              console.error("Failed to load offline notes", e);
          }
      };
      loadOfflineNotes();
      
      // Listen for changes in other tabs/windows
      window.addEventListener('storage', loadOfflineNotes);
      return () => window.removeEventListener('storage', loadOfflineNotes);
  }, [user.id, user.profile.username]);

  // Sync offline notes when connection is restored
  React.useEffect(() => {
      const syncOfflineNotes = async () => {
          if (!navigator.onLine || !onSave) return;
          
          try {
              const notesStr = localStorage.getItem('employee_notes');
              if (!notesStr) return;
              
              const allNotes = JSON.parse(notesStr);
              const unsyncedNotes = allNotes.filter((n: any) => (n.userId === user.id || n.username === user.profile.username) && !n.synced);
              
              if (unsyncedNotes.length === 0) return;
              
              const recordsToSave: AttendanceRecord[] = [];
              unsyncedNotes.forEach((note: any) => {
                  const dates = note.dates || [note.date];
                  
                  dates.forEach((dateStr: string) => {
                      const existingRecord = attendance.find(r => r.date === dateStr);
                      
                      if (note.deleted) {
                          if (existingRecord) {
                              recordsToSave.push({
                                  ...existingRecord,
                                  remarks: '',
                                  isMerged: false,
                                  calendarNote: '',
                                  calendarRemark: undefined,
                                  calendarColor: undefined
                              });
                          }
                      } else {
                          const combinedRemarks = note.remark ? `[${note.remark}] ${note.text}`.trim() : note.text;
                          
                          const updatedRecord: AttendanceRecord = {
                              id: existingRecord?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                              userId: user.id,
                              date: dateStr,
                              amIn: existingRecord?.amIn || '',
                              amOut: existingRecord?.amOut || '',
                              pmIn: existingRecord?.pmIn || '',
                              pmOut: existingRecord?.pmOut || '',
                              undertimeMinutes: existingRecord?.undertimeMinutes || 0,
                              totalDailyMinutes: existingRecord?.totalDailyMinutes || 0,
                              isLocked: existingRecord?.isLocked || false,
                              isPmDepartureLocked: existingRecord?.isPmDepartureLocked || false,
                              remarks: combinedRemarks,
                              isMerged: !!combinedRemarks,
                              calendarNote: note.text,
                              calendarRemark: note.remark as any,
                              calendarColor: note.color
                          };
                          recordsToSave.push(updatedRecord);
                      }
                  });
              });
              
              // Call onSave to sync with backend
              onSave(recordsToSave);
              
              // Remove deleted notes and mark others as synced
              const updatedAllNotes = allNotes
                  .filter((n: any) => !((n.userId === user.id || n.username === user.profile.username) && !n.synced && n.deleted))
                  .map((n: any) => {
                      if ((n.userId === user.id || n.username === user.profile.username) && !n.synced) {
                          return { ...n, synced: true, userId: user.id };
                      }
                      return n;
                  });
              localStorage.setItem('employee_notes', JSON.stringify(updatedAllNotes));
              setOfflineNotes(updatedAllNotes.filter((n: any) => n.userId === user.id || n.username === user.profile.username));
              
          } catch (e) {
              console.error("Failed to sync offline notes", e);
          }
      };

      window.addEventListener('online', syncOfflineNotes);
      
      // Attempt sync on mount if online
      if (navigator.onLine) {
          syncOfflineNotes();
      }
      
      return () => window.removeEventListener('online', syncOfflineNotes);
  }, [user.id, user.profile.username, attendance, onSave]);

  const getCombinedNoteForDate = (dateStr: string) => {
      const record = attendance.find(r => r.date === dateStr);
      const offlineNote = offlineNotes.find(n => n.date === dateStr || (n.dates && n.dates.includes(dateStr)));
      
      return {
          calendarNote: offlineNote?.text || record?.calendarNote || '',
          calendarRemark: offlineNote?.remark || record?.calendarRemark || '',
          calendarColor: offlineNote?.color || record?.calendarColor || 'bg-blue-500',
          isOffline: !!offlineNote
      };
  };

  const NOTE_COLORS = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-red-500', 'bg-orange-500', 
      'bg-yellow-500', 'bg-green-500', 'bg-teal-500'
  ];

  const handleDateClick = (date: Date) => {
      const dateStr = formatDateForInput(date);
      setSelectedDates(prev => 
          prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
      );
  };

  const handleAddNoteDate = () => {
      if (isRangeMode) {
          if (noteDateInput && noteEndDateInput) {
              const start = new Date(noteDateInput);
              const end = new Date(noteEndDateInput);
              const dates: string[] = [];
              
              if (start <= end) {
                  const current = new Date(start);
                  while (current <= end) {
                      dates.push(formatDateForInput(current));
                      current.setDate(current.getDate() + 1);
                  }
                  
                  const combined = [...new Set([...selectedDates, ...dates])];
                  setSelectedDates(combined.sort());
                  setNoteDateInput('');
                  setNoteEndDateInput('');
              }
          }
      } else {
          if (noteDateInput && !selectedDates.includes(noteDateInput)) {
              setSelectedDates([...selectedDates, noteDateInput].sort());
              setNoteDateInput('');
          }
      }
  };

  const handleRemoveDate = (dateStr: string) => {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
  };

  const openNoteModal = () => {
      // If only one date is selected, pre-fill if it has a note
      if (selectedDates.length === 1) {
          const combined = getCombinedNoteForDate(selectedDates[0]);
          if (combined.calendarNote || combined.calendarRemark) {
              setNoteRemark(combined.calendarRemark as any || '');
              setNoteText(combined.calendarNote || '');
              setNoteColor(combined.calendarColor || 'bg-blue-500');
          } else {
              setNoteRemark('');
              setNoteText('');
              setNoteColor('bg-blue-500');
          }
      } else {
          setNoteRemark('');
          setNoteText('');
          setNoteColor('bg-blue-500');
      }
      setShowNoteModal(true);
  };

  const hasExistingNotes = selectedDates.some(dateStr => {
      const combined = getCombinedNoteForDate(dateStr);
      return combined.calendarNote || combined.calendarRemark;
  });

  const handleSaveNote = () => {
      if (!onSave) return;
      
      const recordsToSave: AttendanceRecord[] = [];
      
      selectedDates.forEach(dateStr => {
          const existingRecord = attendance.find(r => r.date === dateStr);
          const combinedRemarks = noteRemark ? `[${noteRemark}] ${noteText}`.trim() : noteText;
          
          const updatedRecord: AttendanceRecord = {
              id: existingRecord?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: user.id,
              date: dateStr,
              amIn: existingRecord?.amIn || '',
              amOut: existingRecord?.amOut || '',
              pmIn: existingRecord?.pmIn || '',
              pmOut: existingRecord?.pmOut || '',
              undertimeMinutes: existingRecord?.undertimeMinutes || 0,
              totalDailyMinutes: existingRecord?.totalDailyMinutes || 0,
              isLocked: existingRecord?.isLocked || false,
              isPmDepartureLocked: existingRecord?.isPmDepartureLocked || false,
              remarks: combinedRemarks,
              isMerged: !!combinedRemarks,
              calendarNote: noteText,
              calendarRemark: noteRemark as any,
              calendarColor: noteColor
          };
          recordsToSave.push(updatedRecord);
      });

      if (navigator.onLine) {
          onSave(recordsToSave);
      }

      // Update offline notes (merged)
      const existingNotesStr = localStorage.getItem('employee_notes');
      const allNotes = existingNotesStr ? JSON.parse(existingNotesStr) : [];
      
      // Find if there's an existing note with same content to merge with
      const noteToMerge = allNotes.find((n: any) => 
          (n.userId === user.id || n.username === user.profile.username) &&
          n.text === noteText &&
          n.remark === noteRemark &&
          n.color === noteColor &&
          !n.deleted
      );

      const newNote = {
          id: noteToMerge ? noteToMerge.id : (Date.now().toString() + Math.random().toString(36).substring(7)),
          userId: user.id,
          username: user.profile.username,
          dates: noteToMerge 
            ? [...new Set([...(noteToMerge.dates || [noteToMerge.date]), ...selectedDates])].sort()
            : selectedDates,
          text: noteText,
          color: noteColor,
          remark: noteRemark,
          createdAt: noteToMerge ? noteToMerge.createdAt : new Date().toISOString(),
          synced: navigator.onLine
      };

      try {
          const filteredNotes = allNotes.filter((n: any) => {
              if (n.userId !== user.id && n.username !== user.profile.username) return true;
              if (noteToMerge && n.id === noteToMerge.id) return false;
              if (n.date) return !selectedDates.includes(n.date);
              if (n.dates) return !n.dates.some((d: string) => selectedDates.includes(d));
              return true;
          });

          const updatedAllNotes = [...filteredNotes, newNote];
          localStorage.setItem('employee_notes', JSON.stringify(updatedAllNotes));
          setOfflineNotes(updatedAllNotes.filter((n: any) => (n.userId === user.id || n.username === user.profile.username) && !n.deleted));
      } catch (e) {
          console.error("Failed to save offline notes", e);
      }

      setShowNoteModal(false);
      setSelectedDates([]);
  };

  const handleRemoveNote = () => {
      if (!onSave) return;
      
      const recordsToSave: AttendanceRecord[] = [];
      
      selectedDates.forEach(dateStr => {
          const existingRecord = attendance.find(r => r.date === dateStr);
          if (existingRecord) {
              const updatedRecord: AttendanceRecord = {
                  ...existingRecord,
                  remarks: '',
                  isMerged: false,
                  calendarNote: '',
                  calendarRemark: undefined,
                  calendarColor: undefined
              };
              recordsToSave.push(updatedRecord);
          }
      });

      if (navigator.onLine) {
          onSave(recordsToSave);
      }

      // Update offline notes
      try {
          const notesStr = localStorage.getItem('employee_notes');
          const allNotes = notesStr ? JSON.parse(notesStr) : [];
          
          const updatedAllNotes = allNotes.map((n: any) => {
              if (n.userId !== user.id && n.username !== user.profile.username) return n;
              
              const dates = n.dates || [n.date];
              const hasOverlap = dates.some((d: string) => selectedDates.includes(d));
              
              if (hasOverlap) {
                  return { ...n, deleted: true, synced: navigator.onLine };
              }
              return n;
          });

          localStorage.setItem('employee_notes', JSON.stringify(updatedAllNotes));
          setOfflineNotes(updatedAllNotes.filter((n: any) => (n.userId === user.id || n.username === user.profile.username) && !n.deleted));
      } catch (e) {
          console.error("Failed to remove offline notes", e);
      }

      setShowNoteModal(false);
      setSelectedDates([]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Hello, {user.profile.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
                {user.profile.position ? `${user.profile.position} - ` : ''} 
                {user.profile.department || 'Employee Dashboard'}
                {user.profile.employeeType === 'PROVINCE' && user.profile.province ? ` (${user.profile.province} Province)` : ''}
                {user.profile.employeeType === 'REGIONAL' ? ' (Regional Office)' : ''}
            </p>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 flex items-center">
            <CalendarDays className="w-4 h-4 mr-2 text-brand-600" />
            {todayDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">This Month (Hours)</p>
                    <p className="text-2xl font-bold text-brand-600 mt-1">{formatMinutesToHours(monthMinutes)}</p>
                </div>
                <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                    <Clock size={20} />
                </div>
             </div>
             <div className="mt-4 text-xs text-gray-400">
                 Recorded for {monthNames[now.getMonth()]}
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Present (Month)</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{daysPresentMonth}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <CalendarDays size={20} />
                </div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Accumulated</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{formatMinutesToHours(totalCompletedMinutes)}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Briefcase size={20} />
                </div>
             </div>
          </div>
      </div>

      {/* Today's Pulse (Hero Card) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-brand-600" /> Today's Pulse
              </h2>
              <Link to="/employee/realtime" className="text-sm text-brand-600 font-medium hover:text-brand-800 flex items-center transition-colors">
                  Go to Real-time <ArrowRight size={16} className="ml-1" />
              </Link>
          </div>
          
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
              {/* Timeline Visualization */}
              <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0 hidden md:block rounded-full"></div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                      {/* AM In */}
                      <div className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${hasTime(todayRecord?.amIn || '') ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${hasTime(todayRecord?.amIn || '') ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <Sun size={14} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">AM Arrival</span>
                          <span className="text-lg font-bold text-gray-800 mt-1">{formatTime(todayRecord?.amIn || '')}</span>
                      </div>

                      {/* AM Out */}
                      <div className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${hasTime(todayRecord?.amOut || '') ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${hasTime(todayRecord?.amOut || '') ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <Clock size={14} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">AM Depart</span>
                          <span className="text-lg font-bold text-gray-800 mt-1">{formatTime(todayRecord?.amOut || '')}</span>
                      </div>

                      {/* PM In */}
                      <div className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${hasTime(todayRecord?.pmIn || '') ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${hasTime(todayRecord?.pmIn || '') ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <Sun size={14} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">PM Arrival</span>
                          <span className="text-lg font-bold text-gray-800 mt-1">{formatTime(todayRecord?.pmIn || '')}</span>
                      </div>

                      {/* PM Out */}
                      <div className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${hasTime(todayRecord?.pmOut || '') ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${hasTime(todayRecord?.pmOut || '') ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <Moon size={14} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">PM Depart</span>
                          <span className="text-lg font-bold text-gray-800 mt-1">{formatTime(todayRecord?.pmOut || '')}</span>
                      </div>
                  </div>
              </div>

              {/* Smart Tip / Prediction */}
              <div className="mt-8 bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl p-5 border border-brand-100 flex items-start">
                  <div className="bg-white p-2 rounded-full shadow-sm text-brand-600 mr-4 flex-shrink-0">
                      <AlertCircle size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-brand-900 text-sm">Status</h4>
                      <p className="text-brand-700 text-sm mt-1 leading-relaxed">
                          {predictionMsg}
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Calendar Section - Full Width */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Calendar Notes</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your daily calendar notes and remarks</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto justify-start md:justify-end">
                    {selectedDates.length > 0 && (
                        <div className="flex flex-wrap gap-2 animate-fade-in w-full sm:w-auto">
                            {hasExistingNotes && (
                                <Button size="sm" variant="danger" onClick={handleRemoveNote} className="flex-1 sm:flex-none justify-center">
                                    <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                                    <span className="text-xs sm:text-sm">Delete Note{selectedDates.length > 1 ? 's' : ''}</span>
                                </Button>
                            )}
                            <Button size="sm" onClick={openNoteModal} className="flex-1 sm:flex-none justify-center">
                                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                                <span className="text-xs sm:text-sm">{selectedDates.length === 1 ? 'Add/Edit Note' : `Add Note to ${selectedDates.length} Days`}</span>
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center bg-gray-50 p-1 sm:p-1.5 rounded-xl border border-gray-100 w-full sm:w-auto justify-between sm:justify-center mt-2 sm:mt-0">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"><ChevronLeft size={20} /></button>
                        <span className="font-bold text-gray-800 min-w-[120px] sm:min-w-[140px] text-center select-none text-sm md:text-base">
                            {monthNames[month]} {year}
                        </span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-4">
                {daysArray.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="min-h-[70px] md:min-h-[100px]"></div>;
                    
                    const dateStr = formatDateForInput(date);
                    const isSelected = selectedDates.includes(dateStr);
                    const combined = getCombinedNoteForDate(dateStr);
                    const hasNote = !!combined.calendarNote || !!combined.calendarRemark;
                    
                    const status = getDayStatus(date);
                    let bgClass = "bg-gray-50 text-gray-400 border-transparent"; // Neutral
                    
                    if (status === 'present') {
                        bgClass = "bg-brand-50 text-brand-700 border-brand-200 ring-2 ring-brand-50 ring-offset-2";
                    } else if (status === 'absent') {
                        bgClass = "bg-red-50 text-red-400 border-red-100";
                    } else if (date.toDateString() === new Date().toDateString()) {
                        bgClass = "bg-white border-brand-500 border-2 text-brand-600 shadow-md";
                    }

                    if (isSelected) {
                        bgClass += " ring-4 ring-brand-500 ring-offset-2 scale-105 z-10";
                    }

                    const remarkColors: Record<string, string> = {
                        'Did not Attend': 'bg-red-100 text-red-700 border-red-200',
                        'Cancelled': 'bg-orange-100 text-orange-700 border-orange-200',
                        'Postponed': 'bg-amber-100 text-amber-700 border-amber-200',
                    };
                    const remarkColor = combined.calendarRemark ? remarkColors[combined.calendarRemark] : 'bg-blue-100 text-blue-700 border-blue-200';

                    // Check for sequence for visual merging
                    const offlineNote = offlineNotes.find(n => n.date === dateStr || (n.dates && n.dates.includes(dateStr)));
                    const isMerged = offlineNote && offlineNote.dates && offlineNote.dates.length > 1;
                    let mergeClass = "";
                    let hasPrev = false;
                    let isPrevInSameWeek = false;
                    
                    if (isMerged) {
                        const sortedDates = [...offlineNote.dates].sort();
                        const dateIndex = sortedDates.indexOf(dateStr);
                        const isFirst = dateIndex === 0;
                        const isLast = dateIndex === sortedDates.length - 1;
                        
                        // Check if previous/next dates are in the same week to merge visually
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
                            key={index} 
                            onClick={() => handleDateClick(date)}
                            title={combined.calendarRemark || combined.calendarNote ? `${combined.calendarRemark ? `[${combined.calendarRemark}] ` : ''}${combined.calendarNote || ''}` : undefined}
                            className={`relative min-h-[70px] md:min-h-[100px] flex flex-col p-1 sm:p-1.5 md:p-2 rounded-xl border transition-all duration-200 hover:scale-105 cursor-pointer overflow-hidden ${bgClass}`}
                        >
                            <div className="flex justify-between items-start w-full">
                                <span className={`text-xs sm:text-sm md:text-base ${status === 'present' ? 'font-bold' : ''}`}>{date.getDate()}</span>
                                {status === 'present' && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-brand-500 flex-shrink-0" />}
                            </div>
                            
                            <div className="flex-1 w-full mt-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                {combined.calendarRemark && (
                                    <div className={`text-[9px] sm:text-[10px] leading-tight break-words px-1 rounded font-medium border min-h-[18px] flex items-center justify-center ${remarkColor} ${mergeClass}`}>
                                        {showText ? combined.calendarRemark : ""}
                                    </div>
                                )}
                                {combined.calendarNote && (
                                    <div className={`text-[9px] sm:text-[10px] leading-tight break-words px-1 py-0.5 rounded text-white min-h-[18px] flex items-center ${combined.calendarColor || 'bg-blue-500'} ${mergeClass}`}>
                                        {showText ? combined.calendarNote : ""}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-600 border-t border-gray-100 pt-6">
                <div className="flex items-center"><div className="w-4 h-4 bg-brand-50 border border-brand-200 rounded-md mr-2 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-brand-500"/></div> Present</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-red-50 border border-red-200 rounded-md mr-2"></div> Absent / Missed</div>
                <div className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-2"></div> Has Note</div>
            </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in relative">
                  <button 
                      onClick={() => setShowNoteModal(false)} 
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="mb-6">
                      <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                          <StickyNote className="w-6 h-6 text-brand-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                          Calendar Note
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                          {selectedDates.length === 1 
                              ? `Adding note for ${new Date(selectedDates[0]).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}`
                              : `Adding note for ${selectedDates.length} selected days`}
                      </p>
                  </div>

                  <div className="space-y-5">
                      <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-semibold text-gray-700">Add More Dates</label>
                              <button 
                                  type="button" 
                                  onClick={() => setIsRangeMode(!isRangeMode)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                              >
                                  {isRangeMode ? 'Switch to Single Date' : 'Switch to Date Range'}
                              </button>
                          </div>
                          
                          <div className="flex flex-col gap-2 mb-2">
                              <div className="flex gap-2">
                                  <div className="flex-1">
                                      {isRangeMode && <span className="text-[10px] text-gray-400 ml-1 uppercase font-bold">Start Date</span>}
                                      <input 
                                          type="date" 
                                          value={noteDateInput}
                                          onChange={(e) => setNoteDateInput(e.target.value)}
                                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                      />
                                  </div>
                                  {isRangeMode && (
                                      <div className="flex-1">
                                          <span className="text-[10px] text-gray-400 ml-1 uppercase font-bold">End Date</span>
                                          <input 
                                              type="date" 
                                              value={noteEndDateInput}
                                              onChange={(e) => setNoteEndDateInput(e.target.value)}
                                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                          />
                                      </div>
                                  )}
                                  <div className={`flex items-end ${isRangeMode ? 'pb-0' : ''}`}>
                                      <Button type="button" onClick={handleAddNoteDate} variant="secondary" className="px-3 h-[38px]">
                                          <Plus size={18} />
                                      </Button>
                                  </div>
                              </div>
                          </div>
                          
                          {selectedDates.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto p-1">
                                  {selectedDates.sort().map(date => (
                                      <div key={date} className="flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100">
                                          {new Date(date).toLocaleDateString()}
                                          <button type="button" onClick={() => handleRemoveDate(date)} className="ml-1.5 text-indigo-400 hover:text-indigo-600">
                                              <X size={14} />
                                          </button>
                                      </div>
                                  ))}
                                  <button 
                                      type="button" 
                                      onClick={() => setSelectedDates([])}
                                      className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase ml-1"
                                  >
                                      Clear All
                                  </button>
                              </div>
                          )}
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Remark (Optional)</label>
                          <div className="flex flex-wrap gap-2">
                              {['None', 'Did not Attend', 'Cancelled', 'Postponed'].map(opt => {
                                  const isSelected = (noteRemark === opt) || (opt === 'None' && !noteRemark);
                                  return (
                                      <button
                                          key={opt}
                                          type="button"
                                          onClick={() => setNoteRemark(opt === 'None' ? '' : opt as any)}
                                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                              isSelected
                                              ? 'bg-brand-600 text-white shadow-md scale-105'
                                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                          }`}
                                      >
                                          {opt}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Note Details</label>
                          <textarea 
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all min-h-[120px] resize-none"
                              placeholder="Enter details about this day..."
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Color Marking</label>
                          <div className="flex flex-wrap gap-2">
                              {NOTE_COLORS.map(color => (
                                  <button
                                      key={color}
                                      type="button"
                                      onClick={() => setNoteColor(color)}
                                      className={`w-8 h-8 rounded-full ${color} transition-all border-2 ${
                                          noteColor === color 
                                          ? 'border-gray-800 scale-110 shadow-md' 
                                          : 'border-transparent hover:scale-105'
                                      }`}
                                      aria-label={`Select color ${color}`}
                                  />
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100">
                      <button 
                          onClick={handleRemoveNote} 
                          disabled={!hasExistingNotes}
                          className={`flex items-center text-sm font-medium transition-colors ${
                              !hasExistingNotes ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-700'
                          }`}
                      >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Remove
                      </button>
                      <div className="flex gap-3">
                          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Cancel</Button>
                          <Button onClick={handleSaveNote}>Save Note</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};