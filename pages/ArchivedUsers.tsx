import React, { useState } from 'react';
import { User, UserRole, StudentType } from '../types';
import { ArchiveRestore, Search, UserCircle } from 'lucide-react';

interface ArchivedUsersProps {
  students: User[];
  employees: User[];
  onRestore: (user: User) => void;
}

export const ArchivedUsers: React.FC<ArchivedUsersProps> = ({ students, employees, onRestore }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'employees'>('students');

  const archivedStudents = students.filter(s => s.isActive === false);
  const archivedEmployees = employees.filter(e => e.isActive === false);

  const filteredStudents = archivedStudents.filter(s => 
    s.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmployees = archivedEmployees.filter(e => 
    e.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Archived User Accounts</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
                activeTab === 'students' 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Students ({archivedStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
                activeTab === 'employees' 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Employees ({archivedEmployees.length})
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search archived users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'students' ? 'Program / Strand' : 'Department'}
                </th>
                {activeTab === 'students' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    School / Address
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'students' ? 'Type' : 'Position'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'students' ? 'Username' : 'Employee ID No.'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'students' ? (
                filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden border border-gray-300">
                            {student.profile.profilePicture ? (
                              <img src={student.profile.profilePicture} alt="" className="w-full h-full object-cover grayscale" />
                            ) : (
                              <UserCircle size={24} />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.profile.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.profile.program || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-medium text-gray-900">{student.profile.school || '-'}</div>
                        <div className="text-xs text-gray-400">{student.profile.schoolAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {student.profile.studentType || 'Student'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.profile.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => onRestore(student)} 
                          className="text-brand-600 hover:text-brand-900 flex items-center justify-end w-full"
                          title="Restore Account"
                        >
                          <ArchiveRestore size={18} className="mr-1" /> Restore
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <ArchiveRestore size={48} className="text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No archived students found</p>
                        <p className="text-sm">Deactivated student accounts will appear here.</p>
                      </div>
                    </td>
                  </tr>
                )
              ) : (
                filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden border border-gray-300">
                            {employee.profile.profilePicture ? (
                              <img src={employee.profile.profilePicture} alt="" className="w-full h-full object-cover grayscale" />
                            ) : (
                              <UserCircle size={24} />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.profile.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.profile.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.profile.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.profile.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => onRestore(employee)} 
                          className="text-brand-600 hover:text-brand-900 flex items-center justify-end w-full"
                          title="Restore Account"
                        >
                          <ArchiveRestore size={18} className="mr-1" /> Restore
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <ArchiveRestore size={48} className="text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No archived employees found</p>
                        <p className="text-sm">Deactivated employee accounts will appear here.</p>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
