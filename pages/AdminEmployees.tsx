import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { formatMinutesToHours } from '../services/utils';
import { Edit, UserX, Plus, X, AlertTriangle, QrCode, Camera, Download, Link as LinkIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

interface AdminEmployeesProps {
  employees: User[];
  attendance: AttendanceRecord[];
  onAdd: (u: User) => void;
  onEdit: (u: User) => void;
  onDeactivate: (id: string) => void;
}

export const AdminEmployees: React.FC<AdminEmployeesProps> = ({ employees, attendance, onAdd, onEdit, onDeactivate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [employeeType, setEmployeeType] = useState<'REGIONAL' | 'PROVINCE'>('REGIONAL');
  const [province, setProvince] = useState('');
  
  // Filter State
  const [activeTab, setActiveTab] = useState<'REGIONAL' | 'PROVINCE'>('REGIONAL');
  
  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrEmployee, setQrEmployee] = useState<User | null>(null);
  
  const openAddModal = () => {
      setEditingId(null);
      setName('');
      setUsername('');
      setPassword('');
      setPosition('');
      setDepartment('');
      setProfilePicture(undefined);
      setEmployeeType('REGIONAL');
      setProvince('');
      setIsModalOpen(true);
  };

  const openEditModal = (employee: User) => {
      setEditingId(employee.id);
      setName(employee.profile.name);
      setUsername(employee.profile.username);
      setPassword(employee.profile.password || '');
      setPosition(employee.profile.position || '');
      setDepartment(employee.profile.department || '');
      setProfilePicture(employee.profile.profilePicture);
      setEmployeeType(employee.profile.employeeType || 'REGIONAL');
      setProvince(employee.profile.province || '');
      setIsModalOpen(true);
  };

  const openQrModal = (employee: User) => {
      // Ensure user has a QR token
      if (!employee.qrToken) {
          const updatedEmployee = { ...employee, qrToken: `qr_${employee.id}_${Math.random().toString(36).substr(2, 9)}` };
          onEdit(updatedEmployee);
          setQrEmployee(updatedEmployee);
      } else {
          setQrEmployee(employee);
      }
      setIsQrModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfilePicture(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDeleteClick = (employee: User) => {
      setEmployeeToDelete(employee);
      setIsDeleteModalOpen(true);
  };

  const confirmDeactivate = () => {
      if (employeeToDelete) {
          onDeactivate(employeeToDelete.id);
          setIsDeleteModalOpen(false);
          setEmployeeToDelete(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const existingEmployee = editingId ? employees.find(e => e.id === editingId) : null;
      
      const userData: User = {
          id: editingId || Date.now().toString(),
          role: UserRole.EMPLOYEE,
          profile: {
              ...(existingEmployee ? existingEmployee.profile : {}),
              name,
              username,
              password: employeeType === 'PROVINCE' ? '' : password,
              position,
              department,
              profilePicture,
              employeeType,
              province: employeeType === 'PROVINCE' ? province : undefined,
              completedHours: existingEmployee ? existingEmployee.profile.completedHours : 0
          },
          qrToken: existingEmployee ? existingEmployee.qrToken : `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      if (editingId) {
          onEdit(userData);
      } else {
          onAdd(userData);
      }
      setIsModalOpen(false);
  };

  const handleExportQR = async () => {
    const element = document.getElementById('qr-id-card');
    if (element && qrEmployee) {
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher resolution
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${qrEmployee.profile.name.replace(/\s+/g, '_')}_ID_Card.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to export QR card:', error);
            alert('Failed to export QR card. Please try again.');
        }
    }
  };

  const activeEmployees = employees.filter(e => e.isActive !== false);
  const filteredEmployees = activeEmployees.filter(e => (e.profile.employeeType || 'REGIONAL') === activeTab);

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Manage Employees</h2>
        <Button onClick={openAddModal} className="w-full sm:w-auto">
            <Plus size={18} className="mr-2" /> Register Employee
        </Button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
          <button
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'REGIONAL' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('REGIONAL')}
          >
              Regional Office Employees
          </button>
          <button
              className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PROVINCE' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('PROVINCE')}
          >
              Province Employees
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position / Dept</th>
                {activeTab === 'PROVINCE' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Province</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Logged</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => {
                  // Calculate hours dynamically from attendance records
                  const employeeAttendance = attendance.filter(r => r.userId === employee.id);
                  const totalMinutes = employeeAttendance.reduce((acc, curr) => acc + curr.totalDailyMinutes, 0);
                  
                  return (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold overflow-hidden border border-gray-200">
                            {employee.profile.profilePicture ? (
                                <img src={employee.profile.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                employee.profile.name.charAt(0)
                            )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.profile.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-medium text-gray-900">{employee.profile.position || '-'}</div>
                        <div className="text-xs text-gray-400">{employee.profile.department}</div>
                    </td>
                    {activeTab === 'PROVINCE' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.profile.province || '-'}
                        </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.profile.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">
                       {formatMinutesToHours(totalMinutes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {employee.profile.employeeType !== 'PROVINCE' && (
                            <button onClick={() => openQrModal(employee)} className="text-gray-600 hover:text-brand-600" title="View QR Code"><QrCode size={18} /></button>
                        )}
                        <button onClick={() => openEditModal(employee)} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(employee)} className="text-red-600 hover:text-red-900" title="Deactivate Account"><UserX size={18} /></button>
                    </td>
                  </tr>
                  );
              })}
              {filteredEmployees.length === 0 && (
                  <tr><td colSpan={activeTab === 'PROVINCE' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">No employees registered yet. Click "Register Employee" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal Overlay */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 border-b pb-2">
                      <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Employee' : 'Register Employee'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex flex-col items-center mb-4">
                          <div className="relative group">
                              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-brand-500 transition-colors">
                                  {profilePicture ? (
                                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                      <Camera size={32} />
                                  )}
                              </div>
                              <label className="absolute bottom-0 right-0 bg-brand-600 text-white p-1.5 rounded-full cursor-pointer shadow-lg hover:bg-brand-700 transition-colors">
                                  <Plus size={16} />
                                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                              </label>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-widest">Profile Photo (Required for Biometrics)</p>
                      </div>

                      <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                      <Input label="Employee ID No." type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="For login" />
                      {employeeType === 'REGIONAL' && (
                          <Input 
                            label="Password (4 characters)" 
                            type="text" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            maxLength={4}
                            minLength={4}
                            placeholder="e.g. 1234"
                          />
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Position" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Staff" />
                        <Input label="Department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. HR" />
                      </div>

                      <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Employee Type</label>
                          <select
                              value={employeeType}
                              onChange={(e) => setEmployeeType(e.target.value as 'REGIONAL' | 'PROVINCE')}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white"
                          >
                              <option value="REGIONAL">Regional Office</option>
                              <option value="PROVINCE">Province</option>
                          </select>
                      </div>

                      {employeeType === 'PROVINCE' && (
                          <Input 
                              label="Province" 
                              value={province} 
                              onChange={e => setProvince(e.target.value)} 
                              placeholder="e.g. Cebu, Bohol" 
                              required 
                          />
                      )}

                      <div className="pt-4 flex space-x-3">
                          <Button fullWidth type="submit">{editingId ? 'Save Changes' : 'Register Employee'}</Button>
                          <Button fullWidth variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && qrEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-0 animate-fade-in relative overflow-hidden">
                  <div className="printable-area flex flex-col items-center justify-center w-full h-full bg-white p-8">
                      {/* ID Card Design */}
                      <div id="qr-id-card" className="w-full border-2 border-gray-200 rounded-2xl p-6 text-center relative overflow-hidden bg-white shadow-sm">
                          {/* Header Decoration */}
                          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                          
                          <div className="mt-8 mb-2">
                              <h2 className="text-xl font-bold text-gray-900 leading-tight">{qrEmployee.profile.name}</h2>
                              <p className="text-sm text-gray-500 font-medium">{qrEmployee.profile.position || 'Employee'}</p>
                              <p className="text-xs text-gray-400">{qrEmployee.profile.department}</p>
                          </div>

                          <div className="my-6 flex justify-center">
                              <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                                  <QRCodeSVG 
                                      value={qrEmployee.qrToken || ''} 
                                      size={160}
                                      level="H"
                                      includeMargin={true}
                                  />
                              </div>
                          </div>

                          <div className="text-xs text-gray-400 font-mono tracking-wider uppercase">
                              ID: {qrEmployee.profile.username}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-[10px] text-gray-400">
                                  Use this QR code to log in securely.
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Controls (Hidden on Print) */}
                  <div className="absolute top-4 right-4 no-print z-10">
                      <button onClick={() => setIsQrModalOpen(false)} className="bg-white/80 p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-100 no-print">
                      <Button fullWidth onClick={handleExportQR} className="bg-slate-900 hover:bg-slate-800 shadow-lg">
                          <Download size={18} className="mr-2" /> Export QR Card
                      </Button>
                      <p className="text-[10px] text-center text-gray-400 mt-3 leading-relaxed">
                          Clicking export will download the ID card as an image.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {isDeleteModalOpen && employeeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Deactivate Employee?</h3>
                      <p className="text-sm text-gray-500 mt-2">
                          Are you sure you want to deactivate <strong>{employeeToDelete.profile.name}</strong>? Their account will be moved to the Archived User Accounts dashboard.
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <Button fullWidth variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                      <Button fullWidth variant="danger" onClick={confirmDeactivate}>Deactivate</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};