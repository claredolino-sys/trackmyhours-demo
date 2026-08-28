import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Shield, Key, UserCircle, UserPlus } from 'lucide-react';
import { api } from '../services/api';

interface AdminProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => Promise<{success: boolean, message?: string}> | void;
}

export const AdminProfile: React.FC<AdminProfileProps> = ({ user, onUpdate }) => {
  const [profile, setProfile] = useState(user.profile);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Create Admin State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createAdminSuccess, setCreateAdminSuccess] = useState('');
  const [createAdminError, setCreateAdminError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // If changing password
    if (newPassword || confirmPassword) {
        if (!currentPassword) {
            setError("Please enter your current password to make changes.");
            return;
        }
        
        // Verify current password against the backend
        const verifiedUser = await api.auth.login(user.role, user.profile.username, currentPassword);
        if (!verifiedUser) {
             setError("Incorrect current password.");
             return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 4) {
             setError("Password must be at least 4 characters.");
             return;
        }
        
        // Update with new password
        const updatedProfile = { ...profile, password: newPassword };
        const result = await onUpdate({ ...user, profile: updatedProfile });
        if (result && !result.success) {
            setError(result.message || 'Failed to update profile.');
            return;
        }
    } else {
        // Just updating details (no password change)
        const result = await onUpdate({ ...user, profile });
        if (result && !result.success) {
            setError(result.message || 'Failed to update profile.');
            return;
        }
    }
    
    setSuccess('Profile updated successfully.');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreateAdminError('');
      setCreateAdminSuccess('');

      if (newAdminPassword.length < 4) {
          setCreateAdminError("Password must be at least 4 characters.");
          return;
      }

      const newAdmin: User = {
          id: Date.now().toString(),
          role: UserRole.ADMIN,
          profile: {
              name: newAdminName,
              username: newAdminUsername,
              password: newAdminPassword,
              completedHours: 0
          }
      };

      const success = await api.auth.register(newAdmin);
      if (success) {
          setCreateAdminSuccess(`Admin account for ${newAdminName} created successfully.`);
          setNewAdminName('');
          setNewAdminUsername('');
          setNewAdminPassword('');
          setTimeout(() => setCreateAdminSuccess(''), 3000);
      } else {
          setCreateAdminError("Username already exists.");
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-brand-600 px-6 py-6 md:px-8 flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-4">
                    <Shield className="text-white w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{user.role === UserRole.SUPER_ADMIN ? 'Super Admin Account' : 'Admin Account'}</h3>
                    <p className="text-brand-100 text-sm">Manage your credentials and personal details</p>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center text-gray-800 font-medium mb-2 border-b pb-2">
                             <UserCircle className="w-5 h-5 mr-2 text-brand-600" />
                             Personal Information
                        </div>
                        <Input 
                            label="Full Name" 
                            value={profile.name} 
                            onChange={e => setProfile({...profile, name: e.target.value})}
                            required
                        />
                        
                        <Input 
                            label="Username" 
                            value={profile.username} 
                            onChange={e => setProfile({...profile, username: e.target.value})}
                            required
                        />
                    </div>

                    <div className="pt-6">
                        <div className="flex items-center text-gray-800 font-medium mb-4 border-b pb-2">
                             <Key className="w-5 h-5 mr-2 text-brand-600" />
                             Security (Optional)
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                            <Input 
                                label="Current Password" 
                                type="password" 
                                value={currentPassword} 
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Required only if changing password"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="New Password" 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="New password"
                                />
                                <Input 
                                    label="Confirm New Password" 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg animate-fade-in">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg animate-fade-in">
                            {success}
                        </div>
                    )}

                    <div className="pt-2 flex justify-end">
                        <Button type="submit" size="lg" className="w-full sm:w-auto">Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>

        {user.role === UserRole.SUPER_ADMIN && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="bg-gray-800 px-6 py-6 md:px-8 flex items-center">
                    <div className="bg-white/20 p-3 rounded-full mr-4">
                        <UserPlus className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Create Admin Account</h3>
                        <p className="text-gray-300 text-sm">Register a new administrator</p>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <form onSubmit={handleCreateAdmin} className="space-y-6">
                        <div className="space-y-4">
                            <Input 
                                label="Full Name" 
                                value={newAdminName} 
                                onChange={e => setNewAdminName(e.target.value)}
                                required
                            />
                            <Input 
                                label="Username" 
                                value={newAdminUsername} 
                                onChange={e => setNewAdminUsername(e.target.value)}
                                required
                            />
                            <Input 
                                label="Password" 
                                type="password"
                                value={newAdminPassword} 
                                onChange={e => setNewAdminPassword(e.target.value)}
                                required
                            />
                        </div>

                        {createAdminError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg animate-fade-in">
                                {createAdminError}
                            </div>
                        )}

                        {createAdminSuccess && (
                            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg animate-fade-in">
                                {createAdminSuccess}
                            </div>
                        )}

                        <div className="pt-2 flex justify-end">
                            <Button type="submit" size="lg" className="w-full sm:w-auto">Create Admin</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};