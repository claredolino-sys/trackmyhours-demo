import React, { useState, useRef } from 'react';
import { User, UserRole, AttendanceRecord } from '../types';
import { AttendanceInput } from './AttendanceInput';
import { Users, Briefcase, Search, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Edit, Save } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { calculateMinutes, parseTime, formatMinutesToHours, formatTime12Hour } from '../services/utils';

interface AdminAttendanceInputProps {
  students: User[];
  employees: User[];
  attendanceRecords: AttendanceRecord[];
  onSave: (record: AttendanceRecord) => void;
  currentUser: User;
}

export const AdminAttendanceInput: React.FC<AdminAttendanceInputProps> = ({ 
  students, 
  employees, 
  attendanceRecords, 
  onSave,
  currentUser
}) => {
  const [userType, setUserType] = useState<UserRole>(UserRole.STUDENT);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // File Upload State
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit State for History Table
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AttendanceRecord>>({});

  const users = userType === UserRole.STUDENT ? students : employees;
  
  const filteredUsers = users.filter(u => 
    u.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === selectedUserId);

  // Filter attendance records for the selected user
  const userAttendance = attendanceRecords.filter(r => r.userId === selectedUserId);
  const sortedHistory = [...userAttendance]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(record => {
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
              totalDailyMinutes: totalNet
          };
      });

  const handleEditRow = (record: AttendanceRecord) => {
      setEditingId(record.id);
      setEditData({ ...record });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setEditData({});
  };

  const handleSaveRow = async () => {
      if (!editingId) return;
      
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

      await (onSave as any)(updatedRecord);
      setEditingId(null);
      setEditData({});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadMessage('Processing file...');

    try {
      const data = await file.arrayBuffer();
      const workbook = read(new Uint8Array(data), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Use raw: false to get formatted strings (e.g. "08:00 AM", "10/25/2023")
      const jsonData = utils.sheet_to_json(worksheet, { raw: false });

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Combine all users for lookup
      const allUsers = [...students, ...employees];
      
      // Helper to parse date to YYYY-MM-DD
      const parseDate = (val: any): string => {
          if (!val) return '';
          
          let strVal = String(val).trim();

          // Handle Excel serial number (numeric string like "45224")
          if (/^\d{5}(\.\d+)?$/.test(strVal)) {
              const serial = parseFloat(strVal);
              // Excel base date (Dec 30, 1899) to JS Date (Jan 1, 1970)
              // 25569 days offset
              const date = new Date((serial - 25569) * 86400 * 1000);
              // Adjust for timezone offset if needed, but usually UTC is fine for date part
              // However, local date is safer for "date only" interpretation
              // Adding 12 hours to avoid timezone shifting to previous day
              date.setHours(date.getHours() + 12);
              
              if (!isNaN(date.getTime())) {
                  return date.toISOString().split('T')[0];
              }
          }

          // Handle MM/DD/YYYY or MM-DD-YYYY or M/D/YYYY or M-D-YYYY
          // Allow 2 or 4 digit year
          const parts = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
          if (parts) {
              let [_, m, d, y] = parts;
              if (y.length === 2) {
                  y = '20' + y; // Assume 20xx
              }
              return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          
          // Try standard Date constructor
          const d = new Date(strVal);
          if (!isNaN(d.getTime())) {
              return d.toISOString().split('T')[0];
          }
          
          return '';
      };

      for (const row of jsonData as any[]) {
        // Try to find user by Username (preferred) or Name
        // Normalize keys to lowercase for flexibility
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().replace(/ /g, '_')] = row[key];
        });

        const username = normalizedRow['username'];
        const name = normalizedRow['name'];
        
        let user: User | undefined;
        
        if (username) {
          user = allUsers.find(u => u.profile.username === String(username).trim());
        } else if (name) {
          user = allUsers.find(u => u.profile.name.toLowerCase() === String(name).trim().toLowerCase());
        }
        
        if (!user) {
          failCount++;
          errors.push(`User not found: ${username || name || 'Unknown'}`);
          continue;
        }
        
        // Parse Date
        let dateStr = parseDate(normalizedRow['date']);
        if (!dateStr) {
             failCount++;
             errors.push(`Invalid date for ${user.profile.name} (Value: "${normalizedRow['date']}")`);
             continue;
        }

        // Check for existing record
        const existingRecord = attendanceRecords.find(r => r.userId === user!.id && r.date === dateStr);
        
        const amIn = parseTime(normalizedRow['am_in'] || normalizedRow['time_in']) || existingRecord?.amIn || '';
        const amOut = parseTime(normalizedRow['am_out']) || existingRecord?.amOut || '';
        const pmIn = parseTime(normalizedRow['pm_in']) || existingRecord?.pmIn || '';
        const pmOut = parseTime(normalizedRow['pm_out'] || normalizedRow['time_out']) || existingRecord?.pmOut || '';

        // Calculate minutes
        const amMinutes = calculateMinutes(amIn, amOut);
        const pmMinutes = calculateMinutes(pmIn, pmOut);
        const totalDailyMinutes = amMinutes + pmMinutes;

        const remarks = normalizedRow['remarks'] || existingRecord?.remarks || '';
        const amRemarks = normalizedRow['am_remarks'] || existingRecord?.amRemarks || '';
        const pmRemarks = normalizedRow['pm_remarks'] || existingRecord?.pmRemarks || '';
        const hasTimeLogs = !!(amIn || amOut || pmIn || pmOut);
        const shouldMerge = !hasTimeLogs && !!remarks && !amRemarks && !pmRemarks;

        const newRecord: AttendanceRecord = {
          id: existingRecord ? existingRecord.id : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          date: dateStr,
          amIn,
          amOut,
          pmIn,
          pmOut,
          undertimeMinutes: 0, // Default to 0 for bulk upload
          totalDailyMinutes: totalDailyMinutes,
          isLocked: false,
          isPmDepartureLocked: false,
          remarks: remarks,
          amRemarks: amRemarks,
          pmRemarks: pmRemarks,
          isMerged: existingRecord?.isMerged || shouldMerge
        };
        
        try {
            // Call onSave (cast to any to await if it returns promise)
            await (onSave as any)(newRecord);
            successCount++;
        } catch (err) {
            console.error("Error saving record:", err);
            failCount++;
            errors.push(`Failed to save record for ${user.profile.name} on ${dateStr}`);
        }
      }
      
      setUploadStatus('success');
      setUploadMessage(`Successfully processed ${successCount} records.${failCount > 0 ? ` ${failCount} failed.` : ''}`);
      if (errors.length > 0) {
          console.warn("Upload errors:", errors);
      }
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      setUploadMessage('Failed to process file. Please check the format.');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Username: 'jdoe123',
        Name: 'John Doe',
        Date: '10/25/2023', // MM/DD/YYYY
        'AM In': '08:00 AM',
        'AM Out': '12:00 PM',
        'PM In': '01:00 PM',
        'PM Out': '05:00 PM',
        Remarks: 'Regular Schedule'
      }
    ];

    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Attendance Template");
    writeFile(wb, "attendance_template.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Input Past Time</h2>
        
        {/* User Type Toggle */}
        <div className="bg-white border border-gray-200 p-1 rounded-lg flex items-center shadow-sm w-full md:w-auto">
             <button 
                 onClick={() => { setUserType(UserRole.STUDENT); setSelectedUserId(''); }}
                 className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${userType === UserRole.STUDENT ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 <Users className="w-4 h-4 mr-2" />
                 Students
             </button>
             {currentUser.role === UserRole.SUPER_ADMIN && (
                 <button 
                     onClick={() => { setUserType(UserRole.EMPLOYEE); setSelectedUserId(''); }}
                     className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${userType === UserRole.EMPLOYEE ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     <Briefcase className="w-4 h-4 mr-2" />
                     Employees
                 </button>
             )}
         </div>
      </div>

      {/* Bulk Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
                    Bulk Upload
                </h3>
                <p className="text-sm text-gray-500">Upload CSV or Excel file to import attendance records.</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download Template
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus === 'uploading'}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {uploadStatus === 'uploading' ? (
                        <span className="animate-pulse">Processing...</span>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                        </>
                    )}
                </button>
            </div>
        </div>

        {uploadStatus !== 'idle' && (
            <div className={`p-4 rounded-lg flex items-start ${
                uploadStatus === 'success' ? 'bg-green-50 text-green-800' : 
                uploadStatus === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
            }`}>
                {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />}
                {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />}
                {uploadStatus === 'uploading' && <div className="w-5 h-5 mr-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5"></div>}
                <div className="flex-1">
                    <p className="font-medium">{uploadMessage}</p>
                    {uploadStatus === 'success' && (
                        <p className="text-sm mt-1 opacity-90">
                            Expected columns: Username (or Name), Date, AM In, AM Out, PM In, PM Out, Remarks
                        </p>
                    )}
                </div>
                {uploadStatus !== 'uploading' && (
                    <button onClick={() => setUploadStatus('idle')} className="ml-2 text-gray-500 hover:text-gray-700">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        )}
      </div>

      {/* User Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Select {userType === UserRole.STUDENT ? 'Student' : 'Employee'}
        </label>
        
        <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="pl-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                placeholder={userType === UserRole.EMPLOYEE ? "Search by name or Employee ID No..." : "Search by name or username..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                {filteredUsers.map(user => (
                    <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`flex items-center p-3 rounded-lg border text-left transition-all ${
                            selectedUserId === user.id 
                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' 
                            : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                        }`}
                    >
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3 flex-shrink-0">
                            {user.profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${selectedUserId === user.id ? 'text-brand-900' : 'text-gray-900'}`}>
                                {user.profile.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{userType === UserRole.EMPLOYEE ? 'ID:' : '@'}{user.profile.username}</p>
                        </div>
                    </button>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500">
                No users found matching "{searchTerm}"
            </div>
        )}
      </div>

      {/* Attendance Input Form */}
      {selectedUser ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-4 text-lg">
                      {selectedUser.profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <h3 className="font-bold text-blue-900">Logging for: {selectedUser.profile.name}</h3>
                      <p className="text-sm text-blue-700">
                          {userType === UserRole.STUDENT 
                              ? `${selectedUser.profile.program || 'No Program'} • ${selectedUser.profile.yearLevel || ''}` 
                              : `${selectedUser.profile.position || 'No Position'} • ${selectedUser.profile.department || ''}`
                          }
                      </p>
                  </div>
              </div>
              
              <AttendanceInput 
                  user={selectedUser} 
                  attendanceRecords={userAttendance} 
                  onSave={onSave} 
                  isAdmin={true}
              />

              {/* Attendance History Table */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-800">Attendance History</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                                  <th className="px-6 py-3 text-left font-medium text-gray-500">AM Session</th>
                                  <th className="px-6 py-3 text-left font-medium text-gray-500">PM Session</th>
                                  <th className="px-6 py-3 text-left font-medium text-gray-500">Remarks</th>
                                  <th className="px-6 py-3 text-left font-medium text-gray-500">Total Hours</th>
                                  <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {sortedHistory.map((row) => {
                                  const isEditing = editingId === row.id;
                                  return (
                                      <tr key={row.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{row.date}</td>
                                          
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
                                                              placeholder="AM Remarks"
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
                                                              placeholder="PM Remarks"
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
                                                          placeholder="Hours (e.g. 8)"
                                                          min="0"
                                                          max="24"
                                                          step="0.5"
                                                      />
                                                  </div>
                                              ) : (
                                                  <span className="text-gray-500 italic">
                                                      {row.remarks || '-'} {row.remarksHours ? `(${row.remarksHours} hrs)` : ''}
                                                  </span>
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
                                                          onClick={handleSaveRow}
                                                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                          title="Save"
                                                      >
                                                          <Save className="w-4 h-4" />
                                                      </button>
                                                      <button 
                                                          onClick={handleCancelEdit}
                                                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                          title="Cancel"
                                                      >
                                                          <X className="w-4 h-4" />
                                                      </button>
                                                  </div>
                                              ) : (
                                                  <button 
                                                      onClick={() => handleEditRow(row)}
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
                              {sortedHistory.length === 0 && (
                                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No attendance records found for this user.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
              Select a user above to start logging attendance.
          </div>
      )}
    </div>
  );
};
