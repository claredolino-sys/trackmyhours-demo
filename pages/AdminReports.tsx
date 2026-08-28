import React, { useState, useRef } from 'react';
import { User, AttendanceRecord, UserRole } from '../types';
import { Button } from '../components/Button';
import { generateDTRPdf } from '../services/pdfService';
import { getMonthName } from '../services/utils';
import { FileDown, FileText, Users, Briefcase, Database, Upload, Download, AlertCircle, Eye, X } from 'lucide-react';
import { api } from '../services/api';

interface AdminReportsProps {
  students: User[];
  attendance: AttendanceRecord[];
  currentUser: User;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ students, attendance, currentUser }) => {
  const [userType, setUserType] = useState<UserRole>(UserRole.STUDENT);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate dynamic year range: 2023 to Current Year + 1
  const years = Array.from({ length: currentYear - 2023 + 2 }, (_, i) => 2023 + i);

  // Filter users based on selected type
  const filteredUsers = students.filter(u => u.role === userType);

  const handleGenerate = () => {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student) return;

      const monthName = getMonthName(new Date(selectedYear, selectedMonth, 1).toISOString());
      
      // Filter records for this student
      const studentRecords = attendance.filter(r => r.userId === selectedStudentId);
      
      generateDTRPdf(student, studentRecords, monthName, selectedYear.toString(), 'download');
  };

  const handlePreview = () => {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student) return;

      const monthName = getMonthName(new Date(selectedYear, selectedMonth, 1).toISOString());
      
      // Filter records for this student
      const studentRecords = attendance.filter(r => r.userId === selectedStudentId);
      
      const url = generateDTRPdf(student, studentRecords, monthName, selectedYear.toString(), 'preview');
      if (typeof url === 'string') {
          setPreviewUrl(url);
      }
  };

  const handleExport = async () => {
      const data = await api.system.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trackmyhours_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupMessage({ text: 'Backup downloaded successfully!', type: 'success' });
      setTimeout(() => setBackupMessage({ text: '', type: '' }), 3000);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const content = event.target?.result as string;
              const data = JSON.parse(content);
              
              // Basic validation
              if (!data.students || !data.attendance) {
                  throw new Error('Invalid backup file format');
              }

              const confirmImport = window.confirm('Are you sure you want to import this data? This will overwrite your current local data.');
              if (!confirmImport) return;

              await api.system.importData(data);
              setBackupMessage({ text: 'Data imported successfully! The page will reload.', type: 'success' });
              setTimeout(() => window.location.reload(), 2000);
          } catch (err) {
              setBackupMessage({ text: 'Failed to import data. Please check the file format.', type: 'error' });
              setTimeout(() => setBackupMessage({ text: '', type: '' }), 3000);
          }
      };
      reader.readAsText(file);
  };

  // Reset selected user when toggling type
  const handleTypeChange = (type: UserRole) => {
      setUserType(type);
      setSelectedStudentId('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <h2 className="text-2xl font-bold text-gray-800">Daily Time Records & System</h2>

        {/* DTR Section */}
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center mb-6 text-brand-600">
                <FileText className="w-8 h-8 mr-3" />
                <h3 className="text-xl font-bold">Daily Time Record (CS Form 48)</h3>
            </div>
            <p className="text-gray-500 mb-6">Select a user and a date range to generate and download their official Daily Time Record in PDF format.</p>

            {/* Type Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-8 w-fit">
                <button
                    onClick={() => handleTypeChange(UserRole.STUDENT)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${userType === UserRole.STUDENT ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Students
                </button>
                {currentUser.role === UserRole.SUPER_ADMIN && (
                    <button
                        onClick={() => handleTypeChange(UserRole.EMPLOYEE)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${userType === UserRole.EMPLOYEE ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Employees
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select {userType === UserRole.STUDENT ? 'Student' : 'Employee'}</label>
                    <select 
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                    >
                        <option value="">-- Choose {userType === UserRole.STUDENT ? 'Student' : 'Employee'} --</option>
                        {filteredUsers.map(s => (
                            <option key={s.id} value={s.id}>{s.profile.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <select 
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{getMonthName(new Date(2022, i, 1).toISOString())}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select 
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                        value={selectedYear} 
                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                    size="lg" 
                    variant="secondary"
                    onClick={handlePreview} 
                    disabled={!selectedStudentId}
                    className="flex-1 sm:flex-none"
                >
                    <Eye className="w-5 h-5 mr-2" />
                    Preview DTR
                </Button>
                <Button 
                    size="lg" 
                    onClick={handleGenerate} 
                    disabled={!selectedStudentId}
                    className="flex-1 sm:flex-none"
                >
                    <FileDown className="w-5 h-5 mr-2" />
                    Download DTR PDF
                </Button>
            </div>
        </div>

        {/* System Backup Section */}
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center mb-6 text-teal-600">
                <Database className="w-8 h-8 mr-3" />
                <h3 className="text-xl font-bold">System Data Backup</h3>
            </div>
            <p className="text-gray-500 mb-6">
                Ensure your data is safe. You can export all accounts and attendance records to a file for backup, or import them back if you switch devices or clear your browser data.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-teal-300 transition-colors flex flex-col items-center text-center">
                    <Download className="w-10 h-10 text-teal-500 mb-4" />
                    <h4 className="font-bold text-gray-800 mb-2">Export Data</h4>
                    <p className="text-xs text-gray-500 mb-4">Download all system data as a JSON file.</p>
                    <Button variant="secondary" onClick={handleExport} className="w-full">
                        Download Backup
                    </Button>
                </div>

                <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 transition-colors flex flex-col items-center text-center">
                    <Upload className="w-10 h-10 text-orange-500 mb-4" />
                    <h4 className="font-bold text-gray-800 mb-2">Import Data</h4>
                    <p className="text-xs text-gray-500 mb-4">Restore system data from a backup file.</p>
                    <Button variant="secondary" onClick={handleImportClick} className="w-full">
                        Upload Backup
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>
            </div>

            {backupMessage.text && (
                <div className={`mt-6 p-4 rounded-lg flex items-center text-sm ${backupMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {backupMessage.type === 'success' ? <Database className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                    {backupMessage.text}
                </div>
            )}
        </div>

        {/* Preview Modal */}
        {previewUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-brand-600" />
                            DTR Preview
                        </h3>
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={handleGenerate}>
                                <FileDown className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                            <button 
                                onClick={() => setPreviewUrl(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
                        <iframe 
                            src={previewUrl} 
                            className="w-full h-full rounded-lg border border-gray-300 shadow-inner bg-white"
                            title="DTR Preview"
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};