import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserRole, UserProfile } from '../types';
import { Clock, X, AlertCircle, CheckCircle2, QrCode, Award, StickyNote, Plus, Trash2 } from 'lucide-react';
import { PublicCalendarModal } from '../components/PublicCalendarModal';

interface LoginProps {
  onLogin: (username: string, password?: string, network?: string) => void;
  onRegister: (role: UserRole, profile: UserProfile) => void;
  onResetPassword: (username: string, newPassword?: string, recoveryCode?: string) => Promise<{ success: boolean; message: string }>;
  onScanQR: () => void;
  onGetCertificate: (username: string, password: string) => void;
  onEmployeeAddNote: (username: string, password: string | undefined, dates: string[], noteText: string, noteColor: string, noteRemark: string) => Promise<{ success: boolean; message: string }>;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onResetPassword, onScanQR, onGetCertificate, onEmployeeAddNote }) => {
  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Forgot Password Modal State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  // Certificate Modal State
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certUsername, setCertUsername] = useState('');
  const [certPassword, setCertPassword] = useState('');

  // Notes to Calendar Modal State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteUsername, setNoteUsername] = useState('');
  const [notePassword, setNotePassword] = useState('');
  const [noteDates, setNoteDates] = useState<string[]>([]);
  const [noteDateInput, setNoteDateInput] = useState('');
  const [noteEndDateInput, setNoteEndDateInput] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('bg-blue-500');
  const [noteRemark, setNoteRemark] = useState<'Did not Attend' | 'Cancelled' | 'Postponed' | ''>('');
  const [noteMessage, setNoteMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [showPublicCalendar, setShowPublicCalendar] = useState(false);
  const [publicCalendarUser, setPublicCalendarUser] = useState('');

  const NOTE_COLORS = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-red-500', 'bg-orange-500', 
      'bg-yellow-500', 'bg-green-500', 'bg-teal-500'
  ];

  const handleAddNoteDate = () => {
      if (isRangeMode) {
          if (noteDateInput && noteEndDateInput) {
              const start = new Date(noteDateInput);
              const end = new Date(noteEndDateInput);
              const dates: string[] = [];
              
              if (start <= end) {
                  const current = new Date(start);
                  while (current <= end) {
                      dates.push(formatDateForInput(current));
                      current.setDate(current.getDate() + 1);
                  }
                  
                  // Merge with existing dates, avoiding duplicates
                  const combined = [...new Set([...noteDates, ...dates])];
                  setNoteDates(combined.sort());
                  setNoteDateInput('');
                  setNoteEndDateInput('');
              } else {
                  setNoteMessage({ text: 'End date must be after start date.', type: 'error' });
              }
          }
      } else {
          if (noteDateInput && !noteDates.includes(noteDateInput)) {
              setNoteDates([...noteDates, noteDateInput].sort());
              setNoteDateInput('');
          }
      }
  };

  const handleRemoveNoteDate = (dateToRemove: string) => {
      setNoteDates(noteDates.filter(d => d !== dateToRemove));
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (noteDates.length === 0) {
          setNoteMessage({ text: 'Please select at least one date.', type: 'error' });
          return;
      }
      
      const result = await onEmployeeAddNote(noteUsername, notePassword, noteDates, noteText, noteColor, noteRemark);
      setNoteMessage({ text: result.message, type: result.success ? 'success' : 'error' });
      
      if (result.success) {
          setPublicCalendarUser(noteUsername);
          setTimeout(() => {
              setShowNoteModal(false);
              setNoteMessage({ text: '', type: '' });
              setNoteUsername('');
              setNotePassword('');
              setNoteDates([]);
              setNoteText('');
              setNoteRemark('');
              setNoteColor('bg-blue-500');
              setShowPublicCalendar(true);
          }, 2000);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    onLogin(username, password);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await onResetPassword(forgotUsername, newPassword, recoveryCode);
      setResetMessage({ text: result.message, type: result.success ? 'success' : 'error' });
      
      if (result.success) {
          setTimeout(() => {
              setShowForgot(false);
              setResetMessage({ text: '', type: '' });
              setForgotUsername('');
              setRecoveryCode('');
              setNewPassword('');
          }, 2000);
      }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden relative">
        <div className="bg-brand-600 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center">
               <Clock className="h-10 w-10 text-brand-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TrackMyHours</h1>
          <p className="text-brand-100">Daily Time Record Monitoring System</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <Input 
                  label="Username / Employee ID"
                  type="text"
                  placeholder="Enter your username or Employee ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <Input 
                  label="Password (Optional for Province Employees)"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            
            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                    <input type="checkbox" className="mr-2 rounded text-brand-600 focus:ring-brand-500" />
                    <span className="text-gray-600">Remember me</span>
                </label>
                <button 
                    type="button" 
                    onClick={() => { setShowForgot(true); setResetMessage({text: '', type: ''}); }} 
                    className="text-brand-600 hover:underline"
                >
                    Forgot password?
                </button>
            </div>

            <Button fullWidth size="lg">
                Sign In
            </Button>

            <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center pt-2">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase pt-2">
                    <span className="bg-white px-2 text-brand-600 font-bold tracking-widest">Demo Accounts</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                        setUsername('superadmin123');
                        setPassword('098765');
                        setTimeout(() => onLogin('superadmin123', '098765'), 100);
                    }}
                    className="text-xs border-brand-200 text-brand-700 hover:bg-brand-50 py-2"
                >
                    Admin
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                        setUsername('intern_alpha');
                        setPassword('password123');
                        setTimeout(() => onLogin('intern_alpha', 'password123'), 100);
                    }}
                    className="text-xs border-brand-200 text-brand-700 hover:bg-brand-50 py-2"
                >
                    Student
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                        setUsername('emp_delta');
                        setPassword('password123');
                        setTimeout(() => onLogin('emp_delta', 'password123'), 100);
                    }}
                    className="text-xs border-brand-200 text-brand-700 hover:bg-brand-50 py-2"
                >
                    Employee
                </Button>
            </div>

            <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500 font-bold tracking-widest">Other Options</span>
                </div>
            </div>

            <Button 
                type="button" 
                fullWidth 
                variant="secondary" 
                size="lg" 
                onClick={onScanQR}
                className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
            >
                <QrCode className="w-5 h-5 mr-2" />
                Scan QR Code
            </Button>

            <Button 
                type="button" 
                fullWidth 
                variant="secondary" 
                size="lg" 
                onClick={() => setShowNoteModal(true)}
                className="border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white mt-4"
            >
                <StickyNote className="w-5 h-5 mr-2" />
                Employee Notes to Calendar
            </Button>

            <Button 
                type="button" 
                fullWidth 
                variant="secondary" 
                size="lg" 
                onClick={() => setShowCertificateModal(true)}
                className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white mt-4"
            >
                <Award className="w-5 h-5 mr-2" />
                Student Certificate of Completion
            </Button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in relative">
                  <button 
                      onClick={() => setShowForgot(false)} 
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="mb-6 text-center">
                      <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                      <p className="text-sm text-gray-500 mt-1">
                          Recover access to your account
                      </p>
                  </div>

                  <form onSubmit={handleResetSubmit} className="space-y-4">
                      <Input 
                          label="Username / Employee ID"
                          value={forgotUsername} 
                          onChange={(e) => setForgotUsername(e.target.value)} 
                          required 
                          placeholder="Enter username or Employee ID"
                      />

                      <Input 
                          label="Recovery Code (Admin Only)" 
                          type="password"
                          value={recoveryCode} 
                          onChange={(e) => setRecoveryCode(e.target.value)} 
                          placeholder="Code (Try: admin123)"
                      />
                      <Input 
                          label="New Password" 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          required 
                          placeholder="New password"
                      />

                      {resetMessage.text && (
                          <div className={`p-3 rounded-lg flex items-start text-sm ${resetMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {resetMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />}
                              <span>{resetMessage.text}</span>
                          </div>
                      )}

                      <Button fullWidth type="submit">
                          Reset Password
                      </Button>
                  </form>
              </div>
          </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in relative">
                  <button 
                      onClick={() => setShowCertificateModal(false)} 
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="mb-6 text-center">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Award className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Get Certificate</h3>
                      <p className="text-sm text-gray-500 mt-1">
                          Enter your credentials to view your Certificate of Completion
                      </p>
                  </div>

                  <form onSubmit={(e) => {
                      e.preventDefault();
                      onGetCertificate(certUsername, certPassword);
                      setCertUsername('');
                      setCertPassword('');
                      setShowCertificateModal(false);
                  }} className="space-y-4">
                      <Input 
                          label="Username" 
                          value={certUsername} 
                          onChange={(e) => setCertUsername(e.target.value)} 
                          required 
                          placeholder="Enter username"
                      />
                      <Input 
                          label="Password" 
                          type="password"
                          value={certPassword} 
                          onChange={(e) => setCertPassword(e.target.value)} 
                          required 
                          placeholder="Enter password"
                      />
                      <Button fullWidth className="bg-amber-500 hover:bg-amber-600">
                          View Certificate
                      </Button>
                  </form>
              </div>
          </div>
      )}

      {/* Notes to Calendar Modal */}
      {showNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in relative max-h-[90vh] overflow-y-auto">
                  <button 
                      onClick={() => setShowNoteModal(false)} 
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="mb-6">
                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                          <StickyNote className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                          Notes to Calendar
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                          Add a note to your employee calendar
                      </p>
                  </div>

                  <form onSubmit={handleNoteSubmit} className="space-y-5">
                      <div className="space-y-4">
                          <Input 
                              label="Employee ID No." 
                              value={noteUsername} 
                              onChange={(e) => setNoteUsername(e.target.value)} 
                              required 
                              placeholder="Enter Employee ID No."
                          />
                          <Input 
                              label="Password (Required for Regional)" 
                              type="password"
                              value={notePassword} 
                              onChange={(e) => setNotePassword(e.target.value)} 
                              placeholder="Enter password"
                          />
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-semibold text-gray-700">Select Date(s)</label>
                              <button 
                                  type="button" 
                                  onClick={() => setIsRangeMode(!isRangeMode)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                              >
                                  {isRangeMode ? 'Switch to Single Date' : 'Switch to Date Range'}
                              </button>
                          </div>
                          
                          <div className="flex flex-col gap-2 mb-2">
                              <div className="flex gap-2">
                                  <div className="flex-1">
                                      {isRangeMode && <span className="text-[10px] text-gray-400 ml-1 uppercase font-bold">Start Date</span>}
                                      <input 
                                          type="date" 
                                          value={noteDateInput}
                                          onChange={(e) => setNoteDateInput(e.target.value)}
                                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                      />
                                  </div>
                                  {isRangeMode && (
                                      <div className="flex-1">
                                          <span className="text-[10px] text-gray-400 ml-1 uppercase font-bold">End Date</span>
                                          <input 
                                              type="date" 
                                              value={noteEndDateInput}
                                              onChange={(e) => setNoteEndDateInput(e.target.value)}
                                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                          />
                                      </div>
                                  )}
                                  <div className={`flex items-end ${isRangeMode ? 'pb-0' : ''}`}>
                                      <Button type="button" onClick={handleAddNoteDate} variant="secondary" className="px-3 h-[38px]">
                                          <Plus size={18} />
                                      </Button>
                                  </div>
                              </div>
                          </div>
                          
                          {noteDates.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto p-1">
                                  {noteDates.map(date => (
                                      <div key={date} className="flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100">
                                          {new Date(date).toLocaleDateString()}
                                          <button type="button" onClick={() => handleRemoveNoteDate(date)} className="ml-1.5 text-indigo-400 hover:text-indigo-600">
                                              <X size={14} />
                                          </button>
                                      </div>
                                  ))}
                                  <button 
                                      type="button" 
                                      onClick={() => setNoteDates([])}
                                      className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase ml-1"
                                  >
                                      Clear All
                                  </button>
                              </div>
                          )}
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Remark (Optional)</label>
                          <div className="flex flex-wrap gap-2">
                              {['None', 'Did not Attend', 'Cancelled', 'Postponed'].map(opt => {
                                  const isSelected = (noteRemark === opt) || (opt === 'None' && !noteRemark);
                                  return (
                                      <button
                                          key={opt}
                                          type="button"
                                          onClick={() => setNoteRemark(opt === 'None' ? '' : opt as any)}
                                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                              isSelected
                                              ? 'bg-indigo-600 text-white shadow-md scale-105'
                                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                          }`}
                                      >
                                          {opt}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Note Details</label>
                          <textarea 
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                              placeholder="Enter details about this day..."
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Color Marking</label>
                          <div className="flex flex-wrap gap-2">
                              {NOTE_COLORS.map(color => (
                                  <button
                                      key={color}
                                      type="button"
                                      onClick={() => setNoteColor(color)}
                                      className={`w-8 h-8 rounded-full ${color} transition-all border-2 ${
                                          noteColor === color 
                                          ? 'border-gray-800 scale-110 shadow-md' 
                                          : 'border-transparent hover:scale-105'
                                      }`}
                                      aria-label={`Select color ${color}`}
                                  />
                              ))}
                          </div>
                      </div>

                      {noteMessage.text && (
                          <div className={`p-3 rounded-lg flex items-start text-sm ${noteMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {noteMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />}
                              <span>{noteMessage.text}</span>
                          </div>
                      )}

                      <div className="mt-8 pt-6 border-t border-gray-100">
                          <Button fullWidth type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                              Save Notes to Calendar
                          </Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <PublicCalendarModal 
          isOpen={showPublicCalendar}
          onClose={() => setShowPublicCalendar(false)}
          username={publicCalendarUser}
      />
    </div>
  );
};