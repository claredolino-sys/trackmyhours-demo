import React, { useState } from 'react';
import { User, AttendanceRecord, StudentType } from '../types';
import { formatMinutesToHours, formatDateForInput, addMinutesToTime, formatTime12Hour } from '../services/utils';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Hourglass, 
  CalendarDays,
  Sun,
  Moon,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StudentDashboardProps {
  user: User;
  attendance: AttendanceRecord[];
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, attendance }) => {
  // Stats Logic
  const totalRequired = (user.profile.requiredHours || 0) * 60; // in minutes
  
  // Calculate completed hours directly from attendance records to ensure accuracy
  const completed = attendance.reduce((acc, curr) => acc + curr.totalDailyMinutes, 0);
  
  const remaining = Math.max(0, totalRequired - completed);
  
  const percentage = totalRequired > 0 ? Math.min(100, Math.round((completed / totalRequired) * 100)) : 0;

  // Realistic Recommendation Logic (Cap at 8 hours)
  const dailyTargetMinutes = remaining > 0 ? Math.min(480, remaining) : 0;
  
  // Time Prediction & Today's Activity Logic
  const todayDate = new Date();
  const todayStr = formatDateForInput(todayDate);
  const todayRecord = attendance.find(r => r.date === todayStr);
  
  const formatTime = (time: string) => time ? formatTime12Hour(time) : '--:--';
  const hasTime = (time: string) => !!time && time.length > 0;
  
  let predictionMsg = "";
  if (todayRecord && todayRecord.amIn && dailyTargetMinutes > 0) {
      const targetTime24 = addMinutesToTime(todayRecord.amIn, dailyTargetMinutes + 60);
      predictionMsg = `Based on your ${formatTime12Hour(todayRecord.amIn)} arrival, aim to finish by ${formatTime12Hour(targetTime24)} to meet your daily goal.`;
  } else if (!todayRecord) {
      predictionMsg = "Don't forget to log your AM Arrival to get started today.";
  } else {
      predictionMsg = "Keep up the good work! Make sure to log out before you leave.";
  }

  // Calendar Logic
  const [calendarDate, setCalendarDate] = useState(new Date());
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Celebration Logic
  const [showCelebration, setShowCelebration] = useState(false);
  
  React.useEffect(() => {
    if (user.profile.hoursApproved) {
      setShowCelebration(true);
    }
  }, [user.profile.hoursApproved]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  const daysArray = [];
  for(let i=0; i<firstDayOfMonth; i++) {
      daysArray.push(null);
  }
  for(let i=1; i<=daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
  }

  const isRecordPresent = (r: AttendanceRecord) => {
      return !!(r.amIn || r.amOut || r.pmIn || r.pmOut || (r.remarksHours && r.remarksHours > 0));
  };

  const daysPresent = attendance.filter(isRecordPresent).length;

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

  // Determine welcome message based on student type
  const welcomeSubtitle = user.profile.studentType === StudentType.IMMERSION 
      ? "Here's what's happening with your work immersion today."
      : "Here's what's happening with your internship today.";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, {user.profile.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1">{welcomeSubtitle}</p>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 flex items-center">
            <CalendarDays className="w-4 h-4 mr-2 text-brand-600" />
            {todayDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Pending Approval Notification */}
      {percentage >= 100 && !user.profile.hoursApproved && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start">
              <AlertCircle className="w-6 h-6 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                  <h3 className="text-amber-800 font-bold">Pending Approval</h3>
                  <p className="text-amber-700 text-sm mt-1">
                      Congratulations on completing your required hours! Your total hours are currently pending approval by the Administrator. 
                      Once approved, you will be able to access your Certificate of Completion from the login page.
                  </p>
              </div>
          </div>
      )}

      {/* Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Required</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{user.profile.requiredHours || 0}h</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Target size={20} />
                </div>
             </div>
             <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                 <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '100%' }}></div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold text-brand-600 mt-1">{formatMinutesToHours(completed)}</p>
                </div>
                <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                    <CheckCircle2 size={20} />
                </div>
             </div>
             <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                 <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{formatMinutesToHours(remaining)}</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                    <Hourglass size={20} />
                </div>
             </div>
             <div className="mt-4 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded w-fit">
                 {Math.max(0, 100 - percentage)}% left to go
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Present</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">{daysPresent}</p>
                </div>
                <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                    <CalendarDays size={20} />
                </div>
             </div>
             <div className="mt-4 text-xs text-gray-400">
                 Avg {(daysPresent > 0 ? (completed / daysPresent / 60).toFixed(1) : 0)} hrs/day
             </div>
          </div>
      </div>

      {/* Today's Pulse (Hero Card) */}
      {!user.profile.hoursApproved && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-brand-600" /> Today's Pulse
              </h2>
              <Link to="/student/realtime" className="text-sm text-brand-600 font-medium hover:text-brand-800 flex items-center transition-colors">
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
                      <h4 className="font-bold text-brand-900 text-sm">Daily Tip</h4>
                      <p className="text-brand-700 text-sm mt-1 leading-relaxed">
                          {predictionMsg}
                      </p>
                  </div>
              </div>
          </div>
      </div>
      )}

      {/* Calendar Section - Full Width */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Attendance History</h2>
                    <p className="text-sm text-gray-500 mt-1">Review your daily attendance status</p>
                </div>
                
                <div className="flex items-center bg-gray-50 p-1 sm:p-1.5 rounded-xl border border-gray-100 w-full md:w-auto justify-between sm:justify-center">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"><ChevronLeft size={20} /></button>
                    <span className="font-bold text-gray-800 min-w-[120px] sm:min-w-[140px] text-center select-none text-sm md:text-base">
                        {monthNames[month]} {year}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 md:gap-4">
                {daysArray.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="aspect-square"></div>;
                    
                    const status = getDayStatus(date);
                    let bgClass = "bg-gray-50 text-gray-400 border-transparent"; // Neutral
                    let content = <span className="text-sm md:text-lg">{date.getDate()}</span>;
                    
                    if (status === 'present') {
                        bgClass = "bg-brand-50 text-brand-700 border-brand-200 ring-2 ring-brand-50 ring-offset-2";
                        content = (
                            <>
                                <span className="text-sm md:text-lg font-bold">{date.getDate()}</span>
                                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 absolute bottom-1 right-1 md:bottom-2 md:right-2 text-brand-500" />
                            </>
                        );
                    } else if (status === 'absent') {
                        bgClass = "bg-red-50 text-red-400 border-red-100";
                    } else if (date.toDateString() === new Date().toDateString()) {
                        bgClass = "bg-white border-brand-500 border-2 text-brand-600 shadow-md";
                    }

                    return (
                        <div key={index} className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 cursor-default ${bgClass}`}>
                            {content}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-600 border-t border-gray-100 pt-6">
                <div className="flex items-center"><div className="w-4 h-4 bg-brand-50 border border-brand-200 rounded-md mr-2 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-brand-500"/></div> Present</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-red-50 border border-red-200 rounded-md mr-2"></div> Absent / Missed</div>
            </div>
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-fade-in text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
            <p className="text-gray-600 mb-8">
              {user.profile.studentType === StudentType.IMMERSION 
                ? "Hooray! Your total hours have been approved, and you have officially finished your Work Immersion!"
                : "Hooray! Your total hours have been approved, and you have officially completed your OJT."}
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