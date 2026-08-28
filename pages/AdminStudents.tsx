import React, { useState } from 'react';
import { User, UserRole, StudentType, AttendanceRecord } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { formatMinutesToHours } from '../services/utils';
import { Edit, UserX, Plus, X, AlertTriangle, QrCode, Camera, Download, User as UserIcon, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

interface AdminStudentsProps {
  students: User[];
  attendance: AttendanceRecord[];
  onAdd: (u: User) => void;
  onEdit: (u: User) => void;
  onDeactivate: (id: string) => void;
  onApproveHours: (u: User) => void;
  currentUser: User;
}

export const AdminStudents: React.FC<AdminStudentsProps> = ({ students, attendance, onAdd, onEdit, onDeactivate, onApproveHours, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [program, setProgram] = useState('');
  const [department, setDepartment] = useState('');
  const [studentType, setStudentType] = useState<StudentType>(StudentType.OJT);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [requiredHours, setRequiredHours] = useState<number>(0);
  const [dateStarted, setDateStarted] = useState('');
  
  // Certificate Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certStudent, setCertStudent] = useState<User | null>(null);
  const [certLink, setCertLink] = useState('');

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrStudent, setQrStudent] = useState<User | null>(null);

  const openAddModal = () => {
      setEditingId(null);
      setName('');
      setUsername('');
      setPassword('');
      setSchool('');
      setSchoolAddress('');
      setProgram('');
      setDepartment('');
      setStudentType(StudentType.OJT);
      setProfilePicture(undefined);
      setRequiredHours(0);
      setDateStarted('');
      setIsModalOpen(true);
  };

  const openEditModal = (student: User) => {
      setEditingId(student.id);
      setName(student.profile.name);
      setUsername(student.profile.username);
      setPassword(student.profile.password || '');
      setSchool(student.profile.school || '');
      setSchoolAddress(student.profile.schoolAddress || '');
      setProgram(student.profile.program || '');
      setDepartment(student.profile.department || '');
      setStudentType(student.profile.studentType || StudentType.OJT);
      setProfilePicture(student.profile.profilePicture);
      setRequiredHours(student.profile.requiredHours || 0);
      setDateStarted(student.profile.dateStarted || '');
      setIsModalOpen(true);
  };

  const openQrModal = (student: User) => {
      // Ensure user has a QR token
      if (!student.qrToken) {
          const updatedStudent = { ...student, qrToken: `qr_${student.id}_${Math.random().toString(36).substr(2, 9)}` };
          onEdit(updatedStudent);
          setQrStudent(updatedStudent);
      } else {
          setQrStudent(student);
      }
      setIsQrModalOpen(true);
  };

  const openCertModal = (student: User) => {
      setCertStudent(student);
      setCertLink(student.profile.certificateLink || '');
      setIsCertModalOpen(true);
  };

  const handleSaveCert = (e: React.FormEvent) => {
      e.preventDefault();
      if (certStudent) {
          const updatedStudent = {
              ...certStudent,
              profile: {
                  ...certStudent.profile,
                  certificateLink: certLink
              }
          };
          onEdit(updatedStudent);
          setIsCertModalOpen(false);
          setCertStudent(null);
      }
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

  const handleDeleteClick = (student: User) => {
      setStudentToDelete(student);
      setIsDeleteModalOpen(true);
  };

  const confirmDeactivate = () => {
      if (studentToDelete) {
          onDeactivate(studentToDelete.id);
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const existingStudent = editingId ? students.find(s => s.id === editingId) : null;
      
      const userData: User = {
          id: editingId || Date.now().toString(),
          role: UserRole.STUDENT,
          profile: {
              ...(existingStudent ? existingStudent.profile : {}),
              name,
              username,
              password,
              school,
              schoolAddress,
              program,
              department,
              studentType,
              profilePicture,
              requiredHours: requiredHours,
              dateStarted: dateStarted,
              completedHours: existingStudent ? existingStudent.profile.completedHours : 0
          },
          qrToken: existingStudent ? existingStudent.qrToken : `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
    if (element && qrStudent) {
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher resolution
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${qrStudent.profile.name.replace(/\s+/g, '_')}_ID_Card.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to export QR card:', error);
            alert('Failed to export QR card. Please try again.');
        }
    }
  };

  const activeStudents = students.filter(s => s.isActive !== false);

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Manage Students</h2>
        {currentUser.role === UserRole.SUPER_ADMIN && (
            <Button onClick={openAddModal} className="w-full sm:w-auto">
                <Plus size={18} className="mr-2" /> Register Student
            </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program / Strand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School / Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Dept.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Started</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeStudents.map((student) => {
                 const req = student.profile.requiredHours || 1;
                 // Calculate completed hours dynamically from attendance records
                 const studentAttendance = attendance.filter(r => r.userId === student.id);
                 const totalMinutes = studentAttendance.reduce((acc, curr) => acc + curr.totalDailyMinutes, 0);
                 
                 const percentage = Math.min(100, Math.round((totalMinutes / (req * 60)) * 100));

                 return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold overflow-hidden border border-gray-200">
                            {student.profile.profilePicture ? (
                                <img src={student.profile.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                student.profile.name.charAt(0)
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.profile.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.profile.studentType === StudentType.OJT ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {student.profile.studentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.profile.dateStarted ? new Date(student.profile.dateStarted).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.profile.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                          <div className={`h-2.5 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-brand-600'}`} style={{ width: `${percentage}%` }}></div>
                       </div>
                       <div className="flex flex-col mt-1">
                         <span className="text-xs text-gray-500">{formatMinutesToHours(totalMinutes)} / {student.profile.requiredHours || 0}h</span>
                         {percentage >= 100 && (
                           <span className="text-xs font-bold text-green-600 mt-0.5">Complete</span>
                         )}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {percentage >= 100 && !student.profile.hoursApproved && (
                            <button onClick={() => onApproveHours(student)} className="text-amber-500 hover:text-amber-700" title="Approve Completed Hours"><CheckCircle size={18} /></button>
                        )}
                        {percentage >= 100 && student.profile.hoursApproved && (
                            <button className="text-green-500 cursor-default" title="Hours Approved"><CheckCircle size={18} /></button>
                        )}
                        {currentUser.role === UserRole.SUPER_ADMIN && (
                            <>
                                <button onClick={() => openCertModal(student)} className={`hover:text-amber-600 ${student.profile.certificateLink ? 'text-amber-600' : 'text-gray-400'}`} title="Certificate Link"><LinkIcon size={18} /></button>
                                <button onClick={() => openQrModal(student)} className="text-gray-600 hover:text-brand-600" title="View QR Code"><QrCode size={18} /></button>
                            </>
                        )}
                        <button onClick={() => openEditModal(student)} className="text-indigo-600 hover:text-indigo-900" title="Edit Student Profile"><Edit size={18} /></button>
                        {currentUser.role === UserRole.SUPER_ADMIN && (
                            <button onClick={() => handleDeleteClick(student)} className="text-red-600 hover:text-red-900" title="Deactivate Account"><UserX size={18} /></button>
                        )}
                    </td>
                  </tr>
                 );
              })}
              {students.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No students registered yet. Click "Register Student" to add one.</td></tr>
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
                      <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Student' : 'Register Student'}</h3>
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
                      <Input label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="For login" />
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="School" value={school} onChange={e => setSchool(e.target.value)} />
                        <Input label="Program / Strand" value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. BSCS" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="School Address" value={schoolAddress} onChange={e => setSchoolAddress(e.target.value)} placeholder="City, Province" />
                        <Input label="Assigned Department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. IT Dept" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
                              <select 
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                                value={studentType}
                                onChange={(e) => setStudentType(e.target.value as StudentType)}
                              >
                                  <option value={StudentType.OJT}>OJT Internship</option>
                                  <option value={StudentType.IMMERSION}>Work Immersion</option>
                              </select>
                          </div>
                          <Input 
                              label="Required Hours" 
                              type="number" 
                              value={requiredHours.toString()} 
                              onChange={e => setRequiredHours(parseInt(e.target.value) || 0)} 
                              min={0}
                          />
                      </div>
                      
                      <Input 
                          label="Date Started" 
                          type="date" 
                          value={dateStarted} 
                          onChange={e => setDateStarted(e.target.value)} 
                      />

                      <div className="pt-4 flex space-x-3">
                          <Button fullWidth type="submit">{editingId ? 'Save Changes' : 'Register Student'}</Button>
                          <Button fullWidth variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && qrStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-0 animate-fade-in relative overflow-hidden">
                  <div className="printable-area flex flex-col items-center justify-center w-full h-full bg-white p-8">
                      {/* ID Card Design */}
                      <div id="qr-id-card" className="w-full border-2 border-gray-200 rounded-2xl p-6 text-center relative overflow-hidden bg-white shadow-sm">
                          {/* Header Decoration */}
                          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                          
                          <div className="mt-8 mb-2">
                              <h2 className="text-xl font-bold text-gray-900 leading-tight">{qrStudent.profile.name}</h2>
                              <p className="text-sm text-gray-500 font-medium">{qrStudent.profile.program || 'Student'}</p>
                          </div>

                          <div className="my-6 flex justify-center">
                              <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                                  <QRCodeSVG 
                                      value={qrStudent.qrToken || ''} 
                                      size={160}
                                      level="H"
                                      includeMargin={true}
                                  />
                              </div>
                          </div>

                          <div className="text-xs text-gray-400 font-mono tracking-wider uppercase">
                              ID: {qrStudent.profile.username}
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
      {isDeleteModalOpen && studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Deactivate Student?</h3>
                      <p className="text-sm text-gray-500 mt-2">
                          Are you sure you want to deactivate <strong>{studentToDelete.profile.name}</strong>? Their account will be moved to the Archived User Accounts dashboard.
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <Button fullWidth variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                      <Button fullWidth variant="danger" onClick={confirmDeactivate}>Deactivate</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Certificate Link Modal */}
      {isCertModalOpen && certStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-6 border-b pb-2">
                      <h3 className="text-xl font-bold text-gray-900">Certificate Link</h3>
                      <button onClick={() => setIsCertModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleSaveCert} className="space-y-4">
                      <p className="text-sm text-gray-500 mb-4">
                          Attach a link to the Certificate of Completion for <strong>{certStudent.profile.name}</strong>. If left blank, the student will not be able to access the certificate dashboard.
                      </p>
                      <Input 
                          label="Certificate URL" 
                          type="url" 
                          value={certLink} 
                          onChange={e => setCertLink(e.target.value)} 
                          placeholder="https://example.com/certificate.pdf" 
                      />
                      <div className="pt-4 flex space-x-3">
                          <Button fullWidth type="submit">Save Link</Button>
                          <Button fullWidth variant="secondary" type="button" onClick={() => setIsCertModalOpen(false)}>Cancel</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
