import React, { useState } from 'react';
import { User, StudentType } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface StudentProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ user, onUpdate }) => {
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
        <p className="text-brand-100 text-sm">Manage your personal and academic details</p>
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
               label="Username" 
               value={profile.username} 
               onChange={e => setProfile({...profile, username: e.target.value})}
               disabled
             />
             <Input 
               label="School / University" 
               value={profile.school || ''} 
               onChange={e => setProfile({...profile, school: e.target.value})}
               placeholder="e.g., University of Science"
             />
             <Input 
               label="Program / Strand" 
               value={profile.program || ''} 
               onChange={e => setProfile({...profile, program: e.target.value})}
               placeholder="e.g., BS Information Technology or STEM"
             />
             <div className="md:col-span-2">
                 <Input 
                   label="School Address" 
                   value={profile.schoolAddress || ''} 
                   onChange={e => setProfile({...profile, schoolAddress: e.target.value})}
                   placeholder="City, Province"
                 />
             </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Internship Details</h3>
             
             <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Program Type</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`
                        flex-1 border rounded-lg p-4 cursor-pointer transition-all
                        ${profile.studentType === StudentType.OJT ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}
                    `}>
                        <input 
                            type="radio" 
                            className="sr-only" 
                            name="type" 
                            checked={profile.studentType === StudentType.OJT}
                            onChange={() => setProfile({...profile, studentType: StudentType.OJT})}
                        />
                        <div className="font-bold text-gray-900">OJT Internship</div>
                        <div className="text-xs text-gray-500">On-the-Job Training Program</div>
                    </label>
                    <label className={`
                        flex-1 border rounded-lg p-4 cursor-pointer transition-all
                        ${profile.studentType === StudentType.IMMERSION ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}
                    `}>
                        <input 
                            type="radio" 
                            className="sr-only" 
                            name="type" 
                            checked={profile.studentType === StudentType.IMMERSION}
                            onChange={() => setProfile({...profile, studentType: StudentType.IMMERSION})}
                        />
                        <div className="font-bold text-gray-900">Work Immersion</div>
                        <div className="text-xs text-gray-500">Senior High School Requirement</div>
                    </label>
                </div>

                <div className="mt-4">
                    {profile.studentType && (
                        <div className="animate-fade-in">
                            <Input 
                                label={`Required ${profile.studentType === StudentType.OJT ? 'Internship' : 'Immersion'} Hours`}
                                type="number"
                                value={profile.requiredHours || ''}
                                onChange={e => setProfile({...profile, requiredHours: parseInt(e.target.value)})}
                                placeholder="Total hours required (e.g. 300)"
                                required
                            />
                        </div>
                    )}
                </div>
             </div>
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