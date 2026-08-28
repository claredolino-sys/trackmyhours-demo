import React, { useState } from 'react';
import { ActivityLog, User, UserRole } from '../types';
import { Search, Clock, MapPin, User as UserIcon, Wifi } from 'lucide-react';

interface AdminActivityLogProps {
  logs: ActivityLog[];
  students: User[];
  currentUser: User;
}

export const AdminActivityLog: React.FC<AdminActivityLogProps> = ({ logs, students, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredLogs = logs.filter(log => {
    const user = students.find(s => s.id === log.userId);
    
    // If ADMIN, only show logs where user is a STUDENT or the ADMIN themselves
    if (currentUser.role === UserRole.ADMIN) {
        if (user && user.role !== UserRole.STUDENT && user.id !== currentUser.id) {
            return false;
        }
    }

    const userName = user?.profile.name.toLowerCase() || 'system';
    const action = log.action.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = userName.includes(search) || action.includes(search);
    const matchesDate = dateFilter ? new Date(log.timestamp).toLocaleDateString() === new Date(dateFilter).toLocaleDateString() : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">System Activity Log</h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm text-sm"
            />
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm text-sm"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[700px]">
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
                      {filteredLogs.map(log => {
                          const user = students.find(s => s.id === log.userId);
                          const userName = user ? user.profile.name : 'System';
                          
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
                                                  className="text-brand-600 hover:text-brand-700 font-medium flex items-center"
                                              >
                                                  <MapPin className="w-3 h-3 mr-1" />
                                                  View Map
                                              </a>
                                              <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                  {log.location.lat.toFixed(6)}, {log.location.lng.toFixed(6)}
                                              </span>
                                          </div>
                                      ) : (
                                          <span className="text-gray-400 italic text-xs">N/A</span>
                                      )}
                                  </td>
                              </tr>
                          );
                      })}
                       {filteredLogs.length === 0 && (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No activity logs found.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
