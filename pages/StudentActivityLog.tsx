import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { Wifi, Search, MapPin, Clock, Calendar } from 'lucide-react';

interface StudentActivityLogProps {
  logs: ActivityLog[];
}

export const StudentActivityLog: React.FC<StudentActivityLogProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(log.timestamp).toLocaleDateString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Activity Log</h2>
          <p className="text-gray-500 text-sm mt-1">Track your system interactions and attendance history.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search actions or dates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          <div className="overflow-auto flex-grow custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                       <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Network</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                      {filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50/80 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-brand-500" />
                                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <span className="text-xs text-gray-500 flex items-center gap-2 mt-1 pl-5.5">
                                        <Clock className="w-3 h-3" />
                                        {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className="text-sm font-medium text-gray-700 bg-gray-100/50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                                    {log.action}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  {log.network ? (
                                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-100">
                                          <Wifi className="w-3 h-3" />
                                          {log.network}
                                      </div>
                                  ) : (
                                      <span className="text-xs text-gray-400 italic px-2">Unknown</span>
                                  )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  {log.location ? (
                                      <a 
                                          href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline decoration-brand-300 underline-offset-4 transition-all"
                                      >
                                          <div className="p-1.5 bg-brand-50 rounded-full group-hover:bg-brand-100 transition-colors">
                                            <MapPin className="w-3.5 h-3.5" />
                                          </div>
                                          View Map
                                      </a>
                                  ) : (
                                      <span className="text-xs text-gray-400 italic pl-2">Not recorded</span>
                                  )}
                              </td>
                          </tr>
                      ))}
                       {filteredLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center justify-center text-gray-400">
                                <div className="p-4 bg-gray-50 rounded-full mb-3">
                                  <Search className="w-6 h-6" />
                                </div>
                                <p className="font-medium">No activity logs found</p>
                                <p className="text-xs mt-1">Try adjusting your search terms</p>
                              </div>
                            </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
