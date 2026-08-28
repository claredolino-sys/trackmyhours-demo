import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
// Student Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentProfile } from './pages/StudentProfile';
import { StudentActivityLog } from './pages/StudentActivityLog';
// Employee Pages
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeeProfile } from './pages/EmployeeProfile';
import { AdminEmployees } from './pages/AdminEmployees';
// Shared Pages
import { RealTimeAttendance } from './pages/RealTimeAttendance';
import { DTRView } from './pages/DTRView';
// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProfile } from './pages/AdminProfile';
import { AdminStudents } from './pages/AdminStudents';
import { AdminAttendance } from './pages/AdminAttendance';
import { AdminReports } from './pages/AdminReports';
import { AdminActivityLog } from './pages/AdminActivityLog';
import { AdminStudentLogs } from './pages/AdminStudentLogs';
import { ArchivedUsers } from './pages/ArchivedUsers';
import { EmployeeAssignments } from './pages/EmployeeAssignments';
import { AdminDocumentLinksPage } from './pages/AdminDocumentLinksPage';
import { AdminNotifications } from './pages/AdminNotifications';
import { NetworkGuard } from './components/NetworkGuard';
import { QRScanner } from './components/QRScanner';
import { FaceLiveness } from './components/FaceLiveness';
import { ChatBot } from './components/ChatBot';

import { User, UserRole, AttendanceRecord, ActivityLog, UserProfile, ADMIN_IN_CHARGE } from './types';
import { formatDateForInput } from './services/utils';
import { useActivity } from './contexts/ActivityContext';
import { api } from './services/api';

import { AdminAttendanceInput } from './pages/AdminAttendanceInput';

const App: React.FC = () => {
  const { logs: activityLogs, logActivity, refreshLogs } = useActivity();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  
  // QR & Biometric State
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [showFaceLiveness, setShowFaceLiveness] = useState(false);
  const [showNetworkCheck, setShowNetworkCheck] = useState(false);
  const [pendingVerificationUser, setPendingVerificationUser] = useState<User | null>(null);
  
  // Data State (Fetched from API)
  const [students, setStudents] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Initial Load
  useEffect(() => {
      const initialize = async () => {
          await api.init();
          await refreshData();
      };
      initialize();
  }, []);

  const refreshData = async () => {
      const [s, e, a, ar] = await Promise.all([
          api.students.getAll(),
          api.employees.getAll(),
          api.admins.getAll(),
          api.attendance.getAll()
      ]);
      setStudents(s);
      setEmployees(e);
      setAdmins(a);
      setAttendanceRecords(ar);
      await refreshLogs();
  };

  // Sync current user if their profile is updated in the background
  useEffect(() => {
      if (currentUser) {
          let list: User[] = [];
          if (currentUser.role === UserRole.STUDENT) list = students;
          else if (currentUser.role === UserRole.EMPLOYEE) list = employees;
          else list = admins;

          const updatedUser = list.find(u => u.id === currentUser.id);
          // Only update if actual data changed to avoid loops
          if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
              if (updatedUser.isActive === false) {
                  alert("Your account has been deactivated by the administrator.");
                  setCurrentUser(null);
                  window.location.hash = '/';
              } else {
                  setCurrentUser(updatedUser);
              }
          }
      }
  }, [students, employees, admins]);


  const handleLogin = async (username: string, password?: string) => {
      const user = await api.auth.login(username, password);
      if (user) {
          if (user.isActive === false) {
              alert("Your account has been deactivated. Please contact the administrator.");
              return;
          }
          if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
              // Admin login - no network restrictions
              localStorage.setItem('verified_network', 'Admin Connection');
              completeLogin(user, `${user.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Admin'} logged in`);
          } else if (user.role === UserRole.EMPLOYEE && user.profile.employeeType === 'PROVINCE') {
              // Province Employee - skip network check, but require face liveness
              if (!user.profile.profilePicture) {
                  alert("Biometric verification failed: No profile picture found. Please contact Admin to upload a profile photo.");
                  return;
              }
              setPendingVerificationUser(user);
              localStorage.setItem('verified_network', 'Remote Connection');
              setShowFaceLiveness(true);
          } else {
              // Check for profile picture for biometric verification
              if (!user.profile.profilePicture) {
                  alert("Biometric verification failed: No profile picture found. Please contact Admin to upload a profile photo.");
                  return;
              }
              setPendingVerificationUser(user);
              // Start with Network Check
              setShowNetworkCheck(true);
          }
      } else {
          alert("Invalid credentials.");
      }
  };

  const handleNetworkSuccess = () => {
      setShowNetworkCheck(false);
      // After network check, proceed to Face Liveness
      setShowFaceLiveness(true);
  };

  const completeLogin = async (user: User, activityMessage: string) => {
      // Direct login logic
      let redirectPath = '/admin/dashboard';
      if (user.role === UserRole.STUDENT) {
          redirectPath = user.profile.hoursApproved ? '/student/dashboard' : '/student/realtime';
      } else if (user.role === UserRole.EMPLOYEE) {
          redirectPath = '/employee/realtime';
      }
      
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
          window.location.hash = redirectPath;
      }
      
      // Set user immediately to show dashboard
      setCurrentUser(user);
      
      // Refresh data in background
      await refreshData();

      // Location logic
      let location: { lat: number; lng: number } | undefined = undefined;
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
          try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, { 
                      enableHighAccuracy: true,
                      maximumAge: 0,
                      timeout: 10000
                  });
              });
              location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setCurrentLocation(location);
          } catch (err) {
              console.error("Location access denied or failed:", err);
              // alert("Location access is required for attendance logging. Please enable it."); 
          }
      }

      const network = localStorage.getItem('verified_network') || 'Unknown';
      logActivity(user.id, activityMessage, location, network);
  };

  const handleRegister = async (role: UserRole, profile: UserProfile) => {
      const newUser: User = {
          id: Date.now().toString(),
          role: role,
          profile: { ...profile, completedHours: 0 }
      };
      
      const success = await api.auth.register(newUser);
      if (success) {
          logActivity(newUser.id, `New ${role} registered: ${profile.name}`, currentLocation);
          await refreshData();
          alert(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully! You can now log in.`);
      } else {
          alert("Username already exists.");
      }
  };

  const handleResetPassword = async (username: string, newPassword?: string, recoveryCode?: string) => {
      const isAdmin = admins.some(a => a.profile.username === username);
      if (isAdmin && recoveryCode !== 'admin123') {
           return { success: false, message: "Invalid Recovery Code for Admin account." };
      }

      const res = await api.auth.resetPassword(username, newPassword);
      if (res.success) {
          await refreshData();
      }

      return res;
  };

  const handleLogout = () => {
    if (currentUser) {
        logActivity(currentUser.id, 'Logged out', currentLocation);
        sessionStorage.removeItem(`celebration_${currentUser.id}`);
    }
    setCurrentUser(null);
    setCurrentLocation(undefined);
  };

  const handleQRScan = async (token: string) => {
      setIsQRScannerOpen(false);
      const user = await api.auth.loginWithQR(token);
      if (user) {
          if (user.isActive === false) {
              alert("Your account has been deactivated. Please contact the administrator.");
              return;
          }
          if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
              alert("QR Login is not available for Administrators.");
              return;
          }

          // Check if user has a profile picture for biometric verification
          if (!user.profile.profilePicture) {
              alert("Biometric verification failed: No profile picture found. Please contact Admin to upload a profile photo.");
              return;
          }

          setPendingVerificationUser(user);
          setShowNetworkCheck(true);
      } else {
          alert("Invalid QR Code.");
      }
  };

  const handleFaceSuccess = async () => {
      if (!pendingVerificationUser) return;

      const user = pendingVerificationUser;
      // Don't close modal here to prevent flashing back to login
      // setShowFaceLiveness(false); 
      // setPendingVerificationUser(null);

      completeLogin(user, `${user.role} logged in via Biometrics`);
  };


  // --- CRUD Handlers (Now using API) ---

  const handleUpdateProfile = async (updatedUser: User) => {
      if (updatedUser.role === UserRole.STUDENT) await api.students.update(updatedUser);
      else if (updatedUser.role === UserRole.EMPLOYEE) await api.employees.update(updatedUser);
      else if (updatedUser.role === UserRole.ADMIN || updatedUser.role === UserRole.SUPER_ADMIN) await api.admins.update(updatedUser);
      
      logActivity(updatedUser.id, 'Updated profile', currentLocation);
      await refreshData();
      
      // Update current user if it's the one being edited
      if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
  };

  const handleSaveAttendance = async (recordOrRecords: AttendanceRecord | AttendanceRecord[], location?: { lat: number; lng: number }) => {
      // The API now handles hours recalculation automatically!
      const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
      for (const record of records) {
          const isUpdate = attendanceRecords.some(r => r.id === record.id);
          await api.attendance.save(record);
          logActivity(record.userId, `${isUpdate ? 'Updated' : 'Submitted'} attendance for ${record.date}`, location || currentLocation);
      }
      await refreshData(); // Fetch updated records and updated user hours
  };

  const handleUpdateAdminProfile = async (updatedAdmin: User) => {
      const result = await api.admins.update(updatedAdmin);
      if (result.success) {
          logActivity(updatedAdmin.id, 'Updated admin profile');
          await refreshData();
      }
      return result;
  };

  // Admin Actions - Students
  const handleAddStudent = async (newStudent: User) => {
      await api.students.add(newStudent);
      logActivity(currentUser?.id || 'admin', `Registered student: ${newStudent.profile.name}`);
      await refreshData();
  };

  const handleEditStudent = async (updatedStudent: User) => {
      await api.students.update(updatedStudent);
      logActivity(currentUser?.id || 'admin', `Updated student: ${updatedStudent.profile.name}`);
      await refreshData();
  };

  const handleDeactivateStudent = async (studentId: string) => {
      const s = students.find(s => s.id === studentId);
      if (s) {
          await api.students.update({ ...s, isActive: false });
          logActivity(currentUser?.id || 'admin', `Deactivated student: ${s.profile.name}`);
          await refreshData();
      }
  };

  // Admin Actions - Employees
  const handleAddEmployee = async (newEmployee: User) => {
      await api.employees.add(newEmployee);
      logActivity(currentUser?.id || 'admin', `Registered employee: ${newEmployee.profile.name}`);
      await refreshData();
  };

  const handleEditEmployee = async (updatedEmployee: User) => {
      await api.employees.update(updatedEmployee);
      logActivity(currentUser?.id || 'admin', `Updated employee: ${updatedEmployee.profile.name}`);
      await refreshData();
  };

  const handleDeactivateEmployee = async (employeeId: string) => {
      const e = employees.find(e => e.id === employeeId);
      if (e) {
          await api.employees.update({ ...e, isActive: false });
          logActivity(currentUser?.id || 'admin', `Deactivated employee: ${e.profile.name}`);
          await refreshData();
      }
  };

  const handleRestoreUser = async (user: User) => {
      if (user.role === UserRole.STUDENT) {
          await api.students.update({ ...user, isActive: true });
      } else if (user.role === UserRole.EMPLOYEE) {
          await api.employees.update({ ...user, isActive: true });
      }
      logActivity(currentUser?.id || 'admin', `Restored user: ${user.profile.name}`);
      await refreshData();
  };

  const handleApproveHours = async (user: User) => {
      if (user.role === UserRole.STUDENT) {
          await api.students.update({ ...user, profile: { ...user.profile, hoursApproved: true } });
      } else if (user.role === UserRole.EMPLOYEE) {
          await api.employees.update({ ...user, profile: { ...user.profile, hoursApproved: true } });
      }
      logActivity(currentUser?.id || 'admin', `Approved completed hours for: ${user.profile.name}`);
      await refreshData();
  };

  const handleGetCertificate = async (username: string, password: string) => {
      const user = await api.auth.login(UserRole.STUDENT, username, password);
      if (user) {
          if (user.isActive === false) {
              alert("Your account has been deactivated. Please contact the administrator.");
              return;
          }
          if (!user.profile.hoursApproved) {
              alert("Your completed hours are still pending approval by the Administrator. Please check back later.");
              return;
          }
          if (user.profile.certificateLink) {
              window.open(user.profile.certificateLink, '_blank');
          } else {
              alert("Your Certificate of Completion has not been uploaded yet. Please check back later or contact your administrator.");
          }
      } else {
          alert("Invalid credentials.");
      }
  };

  const handleEmployeeAddNote = async (username: string, password: string | undefined, dates: string[], text: string, color: string, remark: string) => {
      let userId = username; // Fallback to username if offline
      
      if (navigator.onLine) {
          // 1. Authenticate employee if online
          const authenticatedUser = await api.auth.login(UserRole.EMPLOYEE, username, password || '');
          if (!authenticatedUser) {
              return { success: false, message: "Invalid credentials." };
          }
          if (authenticatedUser.isActive === false) {
              return { success: false, message: "Account deactivated." };
          }
          userId = authenticatedUser.id;
      }
      
      // 2. Save note to localStorage for offline access
      try {
          const existingNotesStr = localStorage.getItem('employee_notes');
          const existingNotes = existingNotesStr ? JSON.parse(existingNotesStr) : [];
          
          // Find if there's an existing note with same content to merge with
          const noteToMerge = existingNotes.find((n: any) => 
              n.userId === userId &&
              n.text === text &&
              n.remark === remark &&
              n.color === color &&
              !n.deleted
          );

          const newNote = {
              id: noteToMerge ? noteToMerge.id : (Date.now().toString() + Math.random().toString(36).substring(7)),
              userId: userId,
              username: username,
              dates: noteToMerge 
                ? [...new Set([...(noteToMerge.dates || [noteToMerge.date]), ...dates])].sort()
                : dates,
              text,
              color,
              remark,
              createdAt: noteToMerge ? noteToMerge.createdAt : new Date().toISOString(),
              synced: false
          };

          // Remove old notes that overlap with these dates
          const filteredNotes = existingNotes.filter((n: any) => {
              if (n.userId !== userId) return true;
              if (noteToMerge && n.id === noteToMerge.id) return false;
              if (n.date) return !dates.includes(n.date);
              if (n.dates) return !n.dates.some((d: string) => dates.includes(d));
              return true;
          });
          
          const updatedNotes = [...filteredNotes, newNote];
          localStorage.setItem('employee_notes', JSON.stringify(updatedNotes));
          
          return { 
              success: true, 
              message: navigator.onLine 
                  ? "Notes saved successfully. You can now view them in the calendar." 
                  : "Notes saved offline. They will sync when you connect." 
          };
      } catch (err) {
          console.error("Error saving notes:", err);
          return { success: false, message: "Failed to save notes." };
      }
  };

  if (!currentUser) {
    return (
        <>
            <Login 
                onLogin={handleLogin} 
                onRegister={handleRegister} 
                onResetPassword={handleResetPassword} 
                onScanQR={() => setIsQRScannerOpen(true)}
                onGetCertificate={handleGetCertificate}
                onEmployeeAddNote={handleEmployeeAddNote}
            />
            {isQRScannerOpen && (
                <QRScanner 
                    onScan={handleQRScan} 
                    onClose={() => setIsQRScannerOpen(false)} 
                />
            )}
            {showNetworkCheck && pendingVerificationUser && (
                <div className="fixed inset-0 z-[100] bg-white">
                    <NetworkGuard 
                        userRole={pendingVerificationUser.role}
                        onSuccess={handleNetworkSuccess}
                        onCancel={() => { setShowNetworkCheck(false); setPendingVerificationUser(null); }}
                    />
                </div>
            )}
            {showFaceLiveness && pendingVerificationUser && pendingVerificationUser.profile.profilePicture && (
                <FaceLiveness 
                    storedProfilePicture={pendingVerificationUser.profile.profilePicture}
                    onSuccess={handleFaceSuccess}
                    onCancel={() => { setShowFaceLiveness(false); setPendingVerificationUser(null); }}
                />
            )}
            <ChatBot />
        </>
    );
  }

  const todayStr = formatDateForInput(new Date());
  const todayRecord = attendanceRecords.find(r => r.date === todayStr && r.userId === currentUser.id);

  return (
    <NetworkGuard userRole={currentUser.role}>
      <Router>
        <Layout user={currentUser} onLogout={handleLogout}>
          <Routes>
              {/* Student Routes */}
              {currentUser.role === UserRole.STUDENT && (
                  <>
                      <Route path="/student/dashboard" element={<StudentDashboard user={currentUser} attendance={attendanceRecords.filter(r => r.userId === currentUser.id)} />} />
                      {!currentUser.profile.hoursApproved ? (
                        <Route path="/student/realtime" element={<RealTimeAttendance user={currentUser} onSave={handleSaveAttendance} existingRecord={todayRecord} />} />
                      ) : (
                        <Route path="/student/realtime" element={<Navigate to="/student/dashboard" replace />} />
                      )}
                      <Route path="/student/profile" element={<StudentProfile user={currentUser} onUpdate={handleUpdateProfile} />} />
                      {/* Attendance Input removed for students */}
                      <Route path="/student/dtr" element={<DTRView user={currentUser} attendanceRecords={attendanceRecords.filter(r => r.userId === currentUser.id)} onSave={handleSaveAttendance} />} />
                      <Route path="/student/activity" element={<StudentActivityLog logs={activityLogs.filter(l => l.userId === currentUser.id)} />} />
                      <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
                  </>
              )}

              {/* Employee Routes */}
              {currentUser.role === UserRole.EMPLOYEE && (
                  <>
                      <Route path="/employee/dashboard" element={<EmployeeDashboard user={currentUser} attendance={attendanceRecords.filter(r => r.userId === currentUser.id)} onSave={handleSaveAttendance} />} />
                      <Route path="/employee/realtime" element={<RealTimeAttendance user={currentUser} onSave={handleSaveAttendance} existingRecord={todayRecord} />} />
                      <Route path="/employee/profile" element={<EmployeeProfile user={currentUser} onUpdate={handleUpdateProfile} />} />
                      {/* Attendance Input removed for employees */}
                      <Route path="/employee/dtr" element={<DTRView user={currentUser} attendanceRecords={attendanceRecords.filter(r => r.userId === currentUser.id)} onSave={handleSaveAttendance} />} />
                      <Route path="/employee/activity" element={<StudentActivityLog logs={activityLogs.filter(l => l.userId === currentUser.id)} />} />
                      <Route path="/employee/assignments" element={<EmployeeAssignments user={currentUser} />} />
                      <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
                  </>
              )}

              {/* Admin Routes */}
              {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN) && (
                  <>
                      <Route path="/admin/dashboard" element={
                          <AdminDashboard 
                              students={students} 
                              employees={employees}
                              attendance={attendanceRecords} 
                              activityLogs={activityLogs} 
                              currentUser={currentUser}
                          />
                      } />
                      {currentUser.role === UserRole.SUPER_ADMIN && (
                          <Route path="/admin/notifications" element={<AdminNotifications />} />
                      )}
                      {currentUser.role === UserRole.SUPER_ADMIN && (
                          <Route path="/admin/profile" element={
                              <AdminProfile 
                                  user={currentUser} 
                                  onUpdate={handleUpdateAdminProfile} 
                              />
                          } />
                      )}
                      <Route path="/admin/students" element={
                          <AdminStudents 
                              students={students}
                              attendance={attendanceRecords}
                              onAdd={handleAddStudent} 
                              onEdit={handleEditStudent} 
                              onDeactivate={handleDeactivateStudent} 
                              onApproveHours={handleApproveHours}
                              currentUser={currentUser}
                          />
                      } />
                      {currentUser.role === UserRole.SUPER_ADMIN && (
                          <Route path="/admin/employees" element={
                              <AdminEmployees 
                                  employees={employees}
                                  attendance={attendanceRecords}
                                  onAdd={handleAddEmployee}
                                  onEdit={handleEditEmployee}
                                  onDeactivate={handleDeactivateEmployee}
                              />
                          } />
                      )}
                      <Route path="/admin/attendance" element={
                          <AdminAttendance 
                              students={[...students, ...employees]} 
                              attendance={attendanceRecords} 
                              onSave={handleSaveAttendance}
                              currentUser={currentUser}
                              />
                      } />
                      <Route path="/admin/attendance-input" element={
                          <AdminAttendanceInput 
                              students={students} 
                              employees={employees}
                              attendanceRecords={attendanceRecords} 
                              onSave={handleSaveAttendance} 
                              currentUser={currentUser}
                          />
                      } />
                      <Route path="/admin/reports" element={
                          <AdminReports 
                              students={[...students, ...employees]} 
                              attendance={attendanceRecords} 
                              currentUser={currentUser}
                          />
                      } />
                      {currentUser.role === UserRole.SUPER_ADMIN && (
                          <Route path="/admin/assignments" element={
                              <AdminDocumentLinksPage 
                                  employees={employees} 
                              />
                          } />
                      )}
                      <Route path="/admin/activity" element={
                          <AdminActivityLog 
                              logs={activityLogs} 
                              students={[...students, ...employees]} 
                              currentUser={currentUser}
                          />
                      } />
                      <Route path="/admin/student-logs" element={
                          <AdminStudentLogs 
                              logs={activityLogs} 
                              students={students}
                              employees={employees}
                              currentUser={currentUser}
                          />
                      } />
                      {currentUser.role === UserRole.SUPER_ADMIN && (
                          <Route path="/admin/archived-users" element={
                              <ArchivedUsers 
                                  students={students}
                                  employees={employees}
                                  onRestore={handleRestoreUser}
                              />
                          } />
                      )}
                      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </>
              )}
          </Routes>
        </Layout>
        <ChatBot user={currentUser || undefined} />
      </Router>
    </NetworkGuard>
  );
};

export default App;