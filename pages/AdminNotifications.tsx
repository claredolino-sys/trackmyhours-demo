import React, { useState, useEffect } from 'react';
import { AppNotification, AttendanceRecord, UserRole } from '../types';
import { api } from '../services/api';
import { Bell, Check, Trash2, MapPin, Clock, User as UserIcon, MessageSquare, Image as ImageIcon, Download } from 'lucide-react';
import { formatTime12Hour } from '../services/utils';

export const AdminNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const data = await api.notifications.getAll();
        setNotifications(data);
        setLoading(false);
    };

    const handleMarkAsRead = async (id: string) => {
        await api.notifications.markAsRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleDelete = async (id: string) => {
        await api.notifications.delete(id);
        setNotifications(notifications.filter(n => n.id !== id));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Bell className="w-6 h-6 mr-2 text-brand-600" />
                    Admin Notifications
                </h2>
                <div className="flex items-center space-x-4">
                    <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm font-medium">
                        {notifications.filter(n => !n.isRead).length} Unread
                    </span>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
                    <p className="text-gray-500">You'll see alerts and messages here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`bg-white rounded-xl shadow-sm border transition-all ${
                                notification.isRead ? 'border-gray-200 opacity-75' : 'border-brand-200 ring-1 ring-brand-100'
                            }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-2 rounded-lg ${notification.type === 'PHOTO_UPLOAD' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {notification.type === 'PHOTO_UPLOAD' ? <ImageIcon className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className={`font-bold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                                    {notification.type === 'PHOTO_UPLOAD' ? 'Profile Photo Upload' : 'New Message'}
                                                </h3>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-brand-600 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 mt-1">{notification.message}</p>
                                            
                                            {notification.attachment && notification.attachment.type.startsWith('image/') && (
                                                <div className="mt-3">
                                                    <div className="relative inline-block border border-gray-200 rounded-lg overflow-hidden max-w-xs">
                                                        <img 
                                                            src={`data:${notification.attachment.type};base64,${notification.attachment.data}`} 
                                                            alt={notification.attachment.name}
                                                            className="max-h-48 object-contain bg-gray-50"
                                                        />
                                                        <a 
                                                            href={`data:${notification.attachment.type};base64,${notification.attachment.data}`}
                                                            download={notification.attachment.name}
                                                            className="absolute bottom-2 right-2 p-1.5 bg-white/90 text-gray-700 hover:text-brand-600 rounded-md shadow-sm backdrop-blur-sm transition-colors"
                                                            title="Download Image"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                                                <div className="flex items-center">
                                                    <UserIcon className="w-3.5 h-3.5 mr-1" />
                                                    {notification.userName} ({notification.userRole})
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                                    {new Date(notification.timestamp).toLocaleString()}
                                                </div>
                                                {/* @ts-ignore - location might still exist on old records */}
                                                {(notification as any).location && (
                                                    <div className="flex items-center">
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${(notification as any).location.lat},${(notification as any).location.lng}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-brand-600 hover:text-brand-700 hover:underline"
                                                        >
                                                            <MapPin className="w-3.5 h-3.5 mr-1" />
                                                            {(notification as any).location.lat.toFixed(4)}, {(notification as any).location.lng.toFixed(4)}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        {!notification.isRead && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(notification.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
