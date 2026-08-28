import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { User, UserRole } from '../types';
import { Menu, Bell, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user.role === UserRole.SUPER_ADMIN) {
      const fetchNotifications = async () => {
        try {
          const notifs = await api.notifications.getAll();
          setUnreadCount(notifs.filter(n => !n.isRead).length);
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role]);

  const getPageTitle = (role: UserRole) => {
      switch(role) {
          case UserRole.SUPER_ADMIN: return 'Super Admin Dashboard';
          case UserRole.ADMIN: return 'Admin Dashboard';
          case UserRole.EMPLOYEE: return 'Employee Portal';
          default: return 'Student Portal';
      }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        user={user} 
        isOpen={isSidebarOpen} 
        onLogout={onLogout}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-brand-600 text-white px-4 py-3 shadow-md">
           <div className="flex items-center">
             <button onClick={() => setIsSidebarOpen(true)} className="mr-3 focus:outline-none">
               <Menu size={24} />
             </button>
             <span className="font-bold text-lg">TrackMyHours</span>
           </div>
           {user.role === UserRole.SUPER_ADMIN && (
             <div className="flex items-center space-x-3">
               <Link to="/admin/notifications" className="relative text-white hover:text-brand-200 transition-colors">
                 <Bell size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                     {unreadCount > 99 ? '99+' : unreadCount}
                   </span>
                 )}
               </Link>
               <Link to="/admin/profile" className="text-white hover:text-brand-200 transition-colors">
                 <UserCircle size={20} />
               </Link>
             </div>
           )}
        </header>

        {/* Desktop Header / Top Bar */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-xl font-bold text-gray-800">
             {getPageTitle(user.role)}
          </h1>
          <div className="flex items-center space-x-6">
             {user.role === UserRole.SUPER_ADMIN && (
               <div className="flex items-center space-x-4 border-r border-gray-200 pr-6">
                 <Link to="/admin/notifications" className="relative text-gray-500 hover:text-brand-600 transition-colors">
                   <Bell size={24} />
                   {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                       {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                   )}
                 </Link>
                 <Link to="/admin/profile" className="text-gray-500 hover:text-brand-600 transition-colors">
                   <UserCircle size={24} />
                 </Link>
               </div>
             )}
             <div className="flex items-center space-x-4">
               <div className="text-right">
                 <p className="text-sm font-medium text-gray-900">{user.profile.name}</p>
                 <p className="text-xs text-gray-500">@{user.profile.username}</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                  {user.profile.name.charAt(0).toUpperCase()}
               </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};