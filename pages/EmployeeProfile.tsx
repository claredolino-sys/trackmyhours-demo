import React, { useState } from 'react';
import { User } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface EmployeeProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ user, onUpdate }) => {
  const [profile, setProfile] = useState(user.profile);
  const [success, setSuccess] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...user, profile });
    setSuccess('Profile updated successfully.');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-brand-600 px-6 py-6 md:px-8">
        <h2 className="text-xl font-bold text-white">My Profile</h2>
        <p className="text-brand-100 text-sm">Manage your employment details</p>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Input 
               label="Full Name" 
               value={profile.name} 
               onChange={e => setProfile({...profile, name: e.target.value})}
               required
             />
             <Input 
               label="Employee ID No." 
               value={profile.username} 
               onChange={e => setProfile({...profile, username: e.target.value})}
               disabled
             />
             <Input 
               label="Department" 
               value={profile.department || ''} 
               onChange={e => setProfile({...profile, department: e.target.value})}
               placeholder="e.g., IT Department"
             />
             <Input 
               label="Position / Job Title" 
               value={profile.position || ''} 
               onChange={e => setProfile({...profile, position: e.target.value})}
               placeholder="e.g., Senior Developer"
             />
             <Input 
               label="Employee Type" 
               value={profile.employeeType === 'PROVINCE' ? 'Province Employee' : 'Regional Office Employee'} 
               onChange={() => {}}
               disabled
             />
             {profile.employeeType === 'PROVINCE' && (
                 <Input 
                   label="Province" 
                   value={profile.province || ''} 
                   onChange={() => {}}
                   disabled
                 />
             )}
          </div>

          <div className="pt-6">
            <Button type="submit" size="lg" className="w-full sm:w-auto">Save Changes</Button>
            {success && <span className="block mt-3 sm:mt-0 sm:inline sm:ml-4 text-green-600 font-medium animate-pulse">{success}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};