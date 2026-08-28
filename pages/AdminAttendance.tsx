import React, { useState } from 'react';
import { User, AttendanceRecord, UserRole } from '../types';
import { formatMinutesToHours, formatDateForInput, formatTime12Hour, calculateMinutes } from '../services/utils';
import { Search, LayoutList, CalendarDays, CheckCircle2, AlertCircle, Users, Briefcase, Edit, Save, X } from 'lucide-react';

interface AdminAttendanceProps {
  students: User[];
  attendance: AttendanceRecord[];
  onSave?: (record: AttendanceRecord) => void;
  currentUser: User;
}

export const AdminAttendance: React.FC<AdminAttendanceProps> = ({ students, attendance, onSave, currentUser }) => {
  const [view, setView] = useState<'summary' | 'daily'>('summary');
  const [userType, setUserType] = useState<UserRole>(UserRole.STUDENT);
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AttendanceRecord>>({});

  const handleEdit = (record: AttendanceRecord) => {
      setEditingId(record.id);
      setEditData({ ...record });
  };

  const handleCancel = () => {
      setEditingId(null);
      setEditData({});
  };

  const handleSave = () => {
      if (!editingId || !onSave) return;
      
      // Calculate new total minutes
      const amMin = calculateMinutes(editData.amIn || '', editData.amOut || '');
      const pmMin = calculateMinutes(editData.pmIn || '', editData.pmOut || '');
      const totalRaw = amMin + pmMin;
      const undertime = editData.undertimeMinutes || 0;
      let totalNet = Math.max(0, totalRaw - undertime);
      
      if (editData.remarksHours && editData.remarksHours > 0) {
          totalNet += (editData.remarksHours * 60);
      }
      
      const updatedRecord = {
          ...editData,
          totalDailyMinutes: totalNet
      } as AttendanceRecord;

      onSave(updatedRecord);
      setEditingId(null);
      setEditData({});
  };

  // --- Logic for Daily Logs View ---
  const dailyRows = attendance.map(record => {
      const user = students.find(s => s.id === record.userId);
      
      // Recalculate for display accuracy
      const amMin = calculateMinutes(record.amIn, record.amOut);
      const pmMin = calculateMinutes(record.pmIn, record.pmOut);
      const totalRaw = amMin + pmMin;
      let totalNet = Math.max(0, totalRaw - (record.undertimeMinutes || 0));

      if (record.remarksHours && record.remarksHours > 0) {
          totalNet += (record.remarksHours * 60);
      }

      return {
          ...record,
          totalDailyMinutes: totalNet, // Override with calculated value
          user,
          studentName: user?.profile.name || 'Unknown',
          studentUsername: user?.profile.username || 'Unknown',
          userType: user?.role || UserRole.STUDENT
      };
  }).filter(row => {
      // Filter by User Type
      if (row.user?.role !== userType) return false;

      const matchName = row.studentName.toLowerCase().includes(filterName.toLowerCase());
      const matchDate = filterDate ? row.date === filterDate : true;
      return matchName && matchDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Logic for Summary View ---
  const getStudentStats = (studentId: string) => {
      const studentRecords = attendance.filter(r => r.userId === studentId);
      const present = studentRecords.length;
      
      // Recalculate total minutes
      const totalMinutes = studentRecords.reduce((acc, curr) => {
          const amMin = calculateMinutes(curr.amIn, curr.amOut);
          const pmMin = calculateMinutes(curr.pmIn, curr.pmOut);
          const totalRaw = amMin + pmMin;
          let totalNet = Math.max(0, totalRaw - (curr.undertimeMinutes || 0));
          if (curr.remarksHours && curr.remarksHours > 0) {
              totalNet += (curr.remarksHours * 60);
          }
          return acc + totalNet;
      }, 0);
      
      const student = students.find(s => s.id === studentId);
      
      // Calculate Absent: Weekdays from dateStarted (or first log) until yesterday that have no record
      let startDate: Date | null = null;
      
      if (student?.profile.dateStarted) {
          startDate = new Date(student.profile.dateStarted);
      } else if (studentRecords.length > 0) {
          const sortedDates = studentRecords
              .map(r => new Date(r.date).getTime())
              .sort((a, b) => a - b);
          startDate = new Date(sortedDates[0]);
      }
      
      if (!startDate) return { present, absent: 0, totalMinutes };

      const today = new Date();
      const cutoff = new Date(today);
      cutoff.setHours(0,0,0,0); // Stop at today (exclusive)

      let absent = 0;
      let current = new Date(startDate);
      current.setHours(0,0,0,0);
      
      // Safety break to prevent infinite loops in case of weird dates
      let loopCount = 0;
      while (current < cutoff && loopCount < 1000) {
          const day = current.getDay();
          const isWeekend = day === 0 || day === 6;
          
          if (!isWeekend) {
               const dateStr = formatDateForInput(current);
               // Check if any record exists for this date
               const hasRecord = studentRecords.some(r => r.date === dateStr);
               if (!hasRecord) absent++;
          }
          current.setDate(current.getDate() + 1);
          loopCount++;
      }
      
      return { present, absent, totalMinutes };
  };

  const summaryRows = students
    .filter(u => u.role === userType)
    .filter(s => s.profile.name.toLowerCase().includes(filterName.toLowerCase()))
    .map(s => {
      const stats = getStudentStats(s.id);
      return {
          ...s,
          stats
      };
  });

  return (
    <div className="space-y-6">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
           <h2 className="text-2xl font-bold text-gray-800">Manage Attendance</h2>
           
           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
             {/* User Type Toggle */}
             <div className="bg-white border border-gray-200 p-1 rounded-lg flex items-center shadow-sm w-full sm:w-auto">
                 <button 
                     onClick={() => setUserType(UserRole.STUDENT)}
                     className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${userType === UserRole.STUDENT ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     <Users className="w-4 h-4 mr-2" />
                     Students
                 </button>
                 {currentUser.role === UserRole.SUPER_ADMIN && (
                     <button 
                         onClick={() => setUserType(UserRole.EMPLOYEE)}
                         className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${userType === UserRole.EMPLOYEE ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                         <Briefcase className="w-4 h-4 mr-2" />
                         Employees
                     </button>
                 )}
             </div>

             {/* View Toggle */}
             <div className="bg-gray-100 p-1 rounded-lg flex items-center w-full sm:w-auto">
                 <button 
                     onClick={() => setView('summary')}
                     className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     <LayoutList className="w-4 h-4 mr-2" />
                     Summary
                 </button>
                 <button 
                     onClick={() => setView('daily')}
                     className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     <CalendarDays className="w-4 h-4 mr-2" />
                     Logs
                 </button>
             </div>
           </div>
       </div>
       
       {/* Filters */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-5 w-5 text-gray-400" />
               </div>
               <input 
                  type="text" 
                  className="pl-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-brand-500 focus:border-brand-500"
                  placeholder={`Filter by ${userType === UserRole.STUDENT ? 'student' : 'employee'} name...`}
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
               />
           </div>
           {view === 'daily' && (
               <div>
                   <input 
                      type="date" 
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                   />
               </div>
           )}
       </div>

       {/* Content */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {view === 'summary' ? (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">
                        {userType === UserRole.STUDENT ? 'Program' : 'Dept / Position'}
                    </th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500">Days Present</th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500">Days Absent</th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500">Total Hours</th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryRows.map((user) => {
                      const req = user.profile.requiredHours || 0;
                      const completed = user.stats.totalMinutes;
                      // Completion status logic varies
                      let isComplete = false;
                      let statusText = "In Progress";
                      
                      if (userType === UserRole.STUDENT) {
                          isComplete = req > 0 && completed >= (req * 60);
                          statusText = isComplete ? "Completed" : "In Progress";
                      } else {
                          // Employees usually don't have a "Completion" target in the same way, 
                          // but we can check if they have logged hours recently or generic status
                          statusText = "Active"; 
                          isComplete = true; // Use complete style for active employees
                      }

                      return (
                          <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{user.profile.name}</div>
                                  <div className="text-xs text-gray-500">{userType === UserRole.EMPLOYEE ? 'ID:' : '@'}{user.profile.username}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                  {userType === UserRole.STUDENT 
                                    ? (user.profile.program || '-') 
                                    : (
                                        <div className="flex flex-col">
                                            <span>{user.profile.department || '-'}</span>
                                            <span className="text-xs text-gray-400">{user.profile.position}</span>
                                        </div>
                                    )
                                  }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {user.stats.present}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.stats.absent > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {user.stats.absent}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-brand-700">
                                  {formatMinutesToHours(completed)} 
                                  {userType === UserRole.STUDENT && <span className="text-xs font-normal text-gray-400">/ {req}h</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`text-xs font-bold uppercase tracking-wide ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                                      {statusText}
                                  </span>
                              </td>
                          </tr>
                      );
                  })}
                  {summaryRows.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No {userType === UserRole.STUDENT ? 'students' : 'employees'} found.</td></tr>
                  )}
                </tbody>
              </table>
          ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">AM Session</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">PM Session</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Remarks</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Total Hours</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyRows.map((row) => {
                      const isEditing = editingId === row.id;
                      return (
                      <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{row.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{row.studentName}</div>
                              <div className="text-xs text-gray-500">{userType === UserRole.EMPLOYEE ? 'ID:' : '@'}{row.studentUsername}</div>
                          </td>
                          
                          {/* AM Session */}
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                      {isEditing ? (
                                          <div className="flex flex-col space-y-1">
                                              <div className="flex items-center space-x-1">
                                                  <input 
                                                      type="time" 
                                                      className="w-24 p-1 text-xs border rounded"
                                                      value={editData.amIn || ''}
                                                      onChange={e => setEditData({...editData, amIn: e.target.value})}
                                                  />
                                                  <span>-</span>
                                                  <input 
                                                      type="time" 
                                                      className="w-24 p-1 text-xs border rounded"
                                                      value={editData.amOut || ''}
                                                      onChange={e => setEditData({...editData, amOut: e.target.value})}
                                                  />
                                              </div>
                                              <div className="flex items-center space-x-1">
                                                  <input 
                                                      type="text" 
                                                      className="w-full p-1 text-xs border rounded placeholder-gray-400"
                                                      placeholder="AM Remarks (e.g. Half Day)"
                                                      value={editData.amRemarks || ''}
                                                      onChange={e => setEditData({...editData, amRemarks: e.target.value})}
                                                  />
                                                  <button 
                                                      type="button"
                                                      onClick={() => setEditData({...editData, amRemarks: 'HALF DAY'})}
                                                      className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium whitespace-nowrap border border-blue-200"
                                                  >
                                                      Half Day
                                                  </button>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex flex-col">
                                              <span>{formatTime12Hour(row.amIn)} - {formatTime12Hour(row.amOut)}</span>
                                              {row.amRemarks && <span className="text-xs text-red-500 font-medium">{row.amRemarks}</span>}
                                          </div>
                                      )}
                                  </td>

                          {/* PM Session */}
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                      {isEditing ? (
                                          <div className="flex flex-col space-y-1">
                                              <div className="flex items-center space-x-1">
                                                  <input 
                                                      type="time" 
                                                      className="w-24 p-1 text-xs border rounded"
                                                      value={editData.pmIn || ''}
                                                      onChange={e => setEditData({...editData, pmIn: e.target.value})}
                                                  />
                                                  <span>-</span>
                                                  <input 
                                                      type="time" 
                                                      className="w-24 p-1 text-xs border rounded"
                                                      value={editData.pmOut || ''}
                                                      onChange={e => setEditData({...editData, pmOut: e.target.value})}
                                                  />
                                              </div>
                                              <div className="flex items-center space-x-1">
                                                  <input 
                                                      type="text" 
                                                      className="w-full p-1 text-xs border rounded placeholder-gray-400"
                                                      placeholder="PM Remarks (e.g. Half Day)"
                                                      value={editData.pmRemarks || ''}
                                                      onChange={e => setEditData({...editData, pmRemarks: e.target.value})}
                                                  />
                                                  <button 
                                                      type="button"
                                                      onClick={() => setEditData({...editData, pmRemarks: 'HALF DAY'})}
                                                      className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100 font-medium whitespace-nowrap border border-orange-200"
                                                  >
                                                      Half Day
                                                  </button>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex flex-col">
                                              <span>{formatTime12Hour(row.pmIn)} - {formatTime12Hour(row.pmOut)}</span>
                                              {row.pmRemarks && <span className="text-xs text-red-500 font-medium">{row.pmRemarks}</span>}
                                          </div>
                                      )}
                                  </td>

                          {/* Remarks */}
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {isEditing ? (
                                  <div className="flex flex-col space-y-1">
                                      <input 
                                          type="text" 
                                          className="w-full p-1 text-xs border rounded"
                                          value={editData.remarks || ''}
                                          onChange={e => setEditData({...editData, remarks: e.target.value})}
                                          placeholder="Remarks..."
                                      />
                                      <input 
                                          type="number" 
                                          className="w-full p-1 text-xs border rounded"
                                          value={editData.remarksHours || ''}
                                          onChange={e => setEditData({...editData, remarksHours: e.target.value ? Number(e.target.value) : undefined})}
                                          placeholder="Remarks Hours"
                                          min="0"
                                          step="0.5"
                                      />
                                  </div>
                              ) : (
                                  <span className="text-gray-500 italic">{row.remarks || '-'} {row.remarksHours ? `(${row.remarksHours} hrs)` : ''}</span>
                              )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap font-bold text-brand-700">
                              {formatMinutesToHours(row.totalDailyMinutes)}
                          </td>
                          
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                              {isEditing ? (
                                  <div className="flex items-center justify-end space-x-2">
                                      <button 
                                          onClick={handleSave}
                                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                                          title="Save"
                                      >
                                          <Save className="w-4 h-4" />
                                      </button>
                                      <button 
                                          onClick={handleCancel}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                                          title="Cancel"
                                      >
                                          <X className="w-4 h-4" />
                                      </button>
                                  </div>
                              ) : (
                                  <button 
                                      onClick={() => handleEdit(row)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Edit"
                                  >
                                      <Edit className="w-4 h-4" />
                                  </button>
                              )}
                          </td>
                      </tr>
                      );
                  })}
                  {dailyRows.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No records found matching filters.</td></tr>
                  )}
                </tbody>
              </table>
          )}
        </div>
      </div>
    </div>
  );
};