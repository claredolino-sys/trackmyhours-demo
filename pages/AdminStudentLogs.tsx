import React, { useState } from 'react';
import { ActivityLog, User, UserRole } from '../types';
import { MapPin, Clock, User as UserIcon, Search, Filter, Wifi } from 'lucide-react';

interface AdminStudentLogsProps {
  logs: ActivityLog[];
  students: User[];
  employees: User[];
  currentUser: User;
}

export const AdminStudentLogs: React.FC<AdminStudentLogsProps> = ({ logs, students, employees, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'employees'>('students');

  const filterLogs = (sectionLogs: ActivityLog[], userList: User[]) => {
    return sectionLogs.filter(log => {
      const user = userList.find(u => u.id === log.userId);
      const userName = user?.profile.name.toLowerCase() || '';
      const action = log.action.toLowerCase();
      const search = searchTerm.toLowerCase();
      return userName.includes(search) || action.includes(search);
    });
  };

  const studentLogs = logs.filter(log => students.some(s => s.id === log.userId));
  const employeeLogs = logs.filter(log => employees.some(e => e.id === log.userId));

  const filteredStudentLogs = filterLogs(studentLogs, students);
  const filteredEmployeeLogs = filterLogs(employeeLogs, employees);

  const renderLogSection = (title: string, sectionLogs: ActivityLog[], userList: User[], colorClass: string) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
      <div className={`px-6 py-4 border-b ${colorClass} flex items-center justify-between flex-shrink-0`}>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="bg-white/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {sectionLogs.length} Logs
        </span>
      </div>
      <div className="overflow-auto flex-grow no-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Timestamp</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">User</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Network</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sectionLogs.map(log => {
              const user = userList.find(u => u.id === log.userId);
              const userName = user ? user.profile.name : 'Unknown';
              
              return (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-2 opacity-50" />
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                      {userName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.network ? (
                      <div className="flex items-center text-xs text-gray-600">
                        <Wifi className="w-3 h-3 mr-1 text-brand-500" />
                        {log.network}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.location ? (
                      <div className="flex items-center space-x-3">
                        <a 
                          href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-brand-600 hover:text-brand-700 font-medium"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          View Map
                        </a>
                        <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {log.location.lat.toFixed(6)}, {log.location.lng.toFixed(6)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not recorded</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {sectionLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                    <p>No activity logs found for this group.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Student & Employee Logs</h2>
          <p className="text-gray-500 mt-1">Monitor all activities and locations of interns and staff.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search name or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'students' 
              ? 'bg-white text-brand-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Students ({filteredStudentLogs.length})
        </button>
        {currentUser.role === UserRole.SUPER_ADMIN && (
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'employees' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Employees ({filteredEmployeeLogs.length})
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1">
        {activeTab === 'students' ? (
          renderLogSection("Intern/Student Activities", filteredStudentLogs, students, "bg-blue-50 border-blue-100")
        ) : (
          renderLogSection("Employee Activities", filteredEmployeeLogs, employees, "bg-emerald-50 border-emerald-100")
        )}
      </div>
    </div>
  );
};
