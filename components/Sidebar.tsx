import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  FileText, 
  Activity, 
  LogOut, 
  LayoutDashboard, 
  CalendarDays,
  UserCircle,
  Timer,
  History,
  Briefcase,
  Bell,
  Award,
  Link as LinkIcon
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onLogout: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onLogout, onCloseMobile }) => {
  const role = user.role;
  const commonClasses = "flex items-center space-x-3 px-4 py-3 text-gray-100 hover:bg-brand-700 hover:text-white transition-colors rounded-lg mb-1";
  const activeClasses = "bg-brand-800 text-white font-medium shadow-sm";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${commonClasses} ${isActive ? activeClasses : ''}`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-brand-600 text-white transform transition-transform duration-200 ease-in-out shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:inset-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="flex items-center justify-center h-16 bg-brand-700 px-4">
            <Clock className="w-6 h-6 mr-2 text-white" />
            <span className="text-xl font-bold tracking-tight">TrackMyHours</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
            {role === UserRole.SUPER_ADMIN && (
              <>
                <NavLink to="/admin/dashboard" className={getNavLinkClass} onClick={onCloseMobile}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/profile" className={getNavLinkClass} onClick={onCloseMobile}>
                  <UserCircle size={20} />
                  <span>My Profile</span>
                </NavLink>
                <NavLink to="/admin/students" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Users size={20} />
                  <span>Manage Students</span>
                </NavLink>
                <NavLink to="/admin/employees" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Briefcase size={20} />
                  <span>Manage Employees</span>
                </NavLink>
                <NavLink to="/admin/attendance" className={getNavLinkClass} onClick={onCloseMobile}>
                  <CalendarDays size={20} />
                  <span>Manage Attendance</span>
                </NavLink>
                <NavLink to="/admin/attendance-input" className={getNavLinkClass} onClick={onCloseMobile}>
                  <History size={20} />
                  <span>Input Past Time</span>
                </NavLink>
                <NavLink to="/admin/reports" className={getNavLinkClass} onClick={onCloseMobile}>
                  <FileText size={20} />
                  <span>Daily Time Records</span>
                </NavLink>
                <NavLink to="/admin/assignments" className={getNavLinkClass} onClick={onCloseMobile}>
                  <LinkIcon size={20} />
                  <span>Document Links</span>
                </NavLink>
                <NavLink to="/admin/activity" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Activity size={20} />
                  <span>Activity Log</span>
                </NavLink>
                <NavLink to="/admin/student-logs" className={getNavLinkClass} onClick={onCloseMobile}>
                  <History size={20} />
                  <span>Student Logs</span>
                </NavLink>
                <NavLink to="/admin/archived-users" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Users size={20} />
                  <span>Archived Accounts</span>
                </NavLink>
              </>
            )}

            {role === UserRole.ADMIN && (
              <>
                <NavLink to="/admin/dashboard" className={getNavLinkClass} onClick={onCloseMobile}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/students" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Users size={20} />
                  <span>Manage Students</span>
                </NavLink>
                <NavLink to="/admin/attendance" className={getNavLinkClass} onClick={onCloseMobile}>
                  <CalendarDays size={20} />
                  <span>Manage Attendance</span>
                </NavLink>
                <NavLink to="/admin/attendance-input" className={getNavLinkClass} onClick={onCloseMobile}>
                  <History size={20} />
                  <span>Input Past Time</span>
                </NavLink>
                <NavLink to="/admin/reports" className={getNavLinkClass} onClick={onCloseMobile}>
                  <FileText size={20} />
                  <span>Daily Time Records</span>
                </NavLink>
                <NavLink to="/admin/activity" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Activity size={20} />
                  <span>Activity Log</span>
                </NavLink>
                <NavLink to="/admin/student-logs" className={getNavLinkClass} onClick={onCloseMobile}>
                  <History size={20} />
                  <span>Student Logs</span>
                </NavLink>
              </>
            )}

            {role === UserRole.STUDENT && (
              <>
                <NavLink to="/student/dashboard" className={getNavLinkClass} onClick={onCloseMobile}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/student/profile" className={getNavLinkClass} onClick={onCloseMobile}>
                  <UserCircle size={20} />
                  <span>My Profile</span>
                </NavLink>
                {!user.profile.hoursApproved && (
                  <NavLink to="/student/realtime" className={getNavLinkClass} onClick={onCloseMobile}>
                    <Timer size={20} />
                    <span>Real-time Input</span>
                  </NavLink>
                )}
                <NavLink to="/student/dtr" className={getNavLinkClass} onClick={onCloseMobile}>
                  <FileText size={20} />
                  <span>Daily Time Record</span>
                </NavLink>
                <NavLink to="/student/activity" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Activity size={20} />
                  <span>Activity Log</span>
                </NavLink>
              </>
            )}

            {role === UserRole.EMPLOYEE && (
              <>
                <NavLink to="/employee/dashboard" className={getNavLinkClass} onClick={onCloseMobile}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/employee/profile" className={getNavLinkClass} onClick={onCloseMobile}>
                  <UserCircle size={20} />
                  <span>My Profile</span>
                </NavLink>
                <NavLink to="/employee/realtime" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Timer size={20} />
                  <span>Real-time Input</span>
                </NavLink>
                <NavLink to="/employee/dtr" className={getNavLinkClass} onClick={onCloseMobile}>
                  <FileText size={20} />
                  <span>Daily Time Record</span>
                </NavLink>
                <NavLink to="/employee/activity" className={getNavLinkClass} onClick={onCloseMobile}>
                  <Activity size={20} />
                  <span>Activity Log</span>
                </NavLink>
                <NavLink to="/employee/assignments" className={getNavLinkClass} onClick={onCloseMobile}>
                  <LinkIcon size={20} />
                  <span>Employee Assignments</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-brand-500">
            <button 
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-brand-100 hover:text-white hover:bg-brand-700 rounded-md transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};