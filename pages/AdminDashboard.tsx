import React from 'react';
import { User, AttendanceRecord, ActivityLog, StudentType, UserRole } from '../types';
import { formatDateForInput } from '../services/utils';
import { Users, Clock, Activity, CheckCircle, Briefcase, UserCheck } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface AdminDashboardProps {
  students: User[];
  employees: User[];
  attendance: AttendanceRecord[];
  activityLogs: ActivityLog[];
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ students, employees, attendance, activityLogs, currentUser }) => {
  const todayStr = formatDateForInput(new Date());
  
  const activeStudentsList = students.filter(s => s.isActive !== false);
  const activeEmployeesList = employees.filter(e => e.isActive !== false);

  // Student Stats
  const totalStudents = activeStudentsList.length;
  const ojtStudents = activeStudentsList.filter(s => s?.profile?.studentType === StudentType.OJT).length;
  const immersionStudents = activeStudentsList.filter(s => s?.profile?.studentType === StudentType.IMMERSION).length;
  const activeStudents = attendance.filter(r => r.date === todayStr && activeStudentsList.some(s => s.id === r.userId)).length;
  const studentActivePercent = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

  // Employee Stats
  const totalEmployees = activeEmployeesList.length;
  const activeEmployees = attendance.filter(r => r.date === todayStr && activeEmployeesList.some(e => e.id === r.userId)).length;
  const employeeActivePercent = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  const attendanceActivityData = currentUser.role === UserRole.SUPER_ADMIN 
    ? [
        { name: 'Students', Total: totalStudents, Active: activeStudents },
        { name: 'Employees', Total: totalEmployees, Active: activeEmployees },
      ]
    : [
        { name: 'Students', Total: totalStudents, Active: activeStudents },
      ];

  const displayLogs = currentUser.role === UserRole.SUPER_ADMIN
    ? activityLogs
    : activityLogs.filter(log => students.some(s => s.id === log.userId) || log.userId === currentUser.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Top Level Metrics with Visual Indicators */}
      <div className={`grid grid-cols-1 ${currentUser.role === UserRole.SUPER_ADMIN ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Student Overview Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Users className="mr-2 text-brand-600" /> Student Overview
                </h2>
                <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded-full">{totalStudents} Total</span>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <div className="text-blue-600 text-xs font-bold uppercase mb-1">OJT Interns</div>
                     <div className="text-2xl font-bold text-gray-900">{ojtStudents}</div>
                 </div>
                 <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                     <div className="text-orange-600 text-xs font-bold uppercase mb-1">Immersion</div>
                     <div className="text-2xl font-bold text-gray-900">{immersionStudents}</div>
                 </div>
             </div>

             <div className="mt-auto">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Active Today</span>
                    <span className="font-bold text-gray-900">{activeStudents} ({studentActivePercent}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${studentActivePercent}%` }}></div>
                </div>
             </div>
          </div>

          {/* Employee Overview Card */}
          {currentUser.role === UserRole.SUPER_ADMIN && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center">
                      <Briefcase className="mr-2 text-purple-600" /> Employee Overview
                  </h2>
                  <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">{totalEmployees} Total</span>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                       <div>
                           <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Staff</div>
                           <div className="text-2xl font-bold text-gray-900">{totalEmployees}</div>
                       </div>
                       <div className="bg-white p-2 rounded-full shadow-sm">
                           <Briefcase className="text-gray-400 w-6 h-6" />
                       </div>
                   </div>
                   <div className="bg-teal-50 p-4 rounded-lg border border-teal-100 flex items-center justify-between">
                       <div>
                           <div className="text-teal-600 text-xs font-bold uppercase mb-1">On Duty</div>
                           <div className="text-2xl font-bold text-gray-900">{activeEmployees}</div>
                       </div>
                       <div className="bg-white p-2 rounded-full shadow-sm">
                           <UserCheck className="text-teal-500 w-6 h-6" />
                       </div>
                   </div>
               </div>

               <div className="mt-auto">
                  <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Attendance Rate</span>
                      <span className="font-bold text-gray-900">{employeeActivePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${employeeActivePercent}%` }}></div>
                  </div>
               </div>
            </div>
          )}
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 gap-6">
          {/* Attendance Activity Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
              <h3 className="text-md font-bold text-gray-800 mb-4">Real-time Input Status</h3>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                          data={attendanceActivityData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip cursor={{fill: 'transparent'}} />
                          <Legend />
                          <Bar dataKey="Total" fill="#e5e7eb" radius={[0, 4, 4, 0]} barSize={20} />
                          <Bar dataKey="Active" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Recent Activity Mini Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Recent System Activity</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Last 5 actions</span>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500">
                      <tr>
                          <th className="px-6 py-3 font-medium">Action</th>
                          <th className="px-6 py-3 font-medium">Time</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {displayLogs.slice(0, 5).map(log => (
                          <tr key={log.id}>
                              <td className="px-6 py-3 text-gray-700">{log.action}</td>
                              <td className="px-6 py-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                      ))}
                      {displayLogs.length === 0 && (
                          <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-500">No activities yet.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};