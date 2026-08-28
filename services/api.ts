import { User, UserRole, AttendanceRecord, ActivityLog, UserProfile, StudentType, AppNotification } from '../types';
import { supabase, isSupabaseActive } from './supabaseClient';
import localforage from 'localforage';
import { generateDummyData } from './dummyData';

// Storage Keys (for LocalStorage fallback)
const KEYS = {
    STUDENTS: 'students',
    EMPLOYEES: 'employees',
    ADMINS: 'admins',
    ATTENDANCE: 'attendanceRecords',
    LOGS: 'activityLogs',
    NOTIFICATIONS: 'notifications',
    DOCUMENTS: 'documents'
};

// --- Low Level Storage Wrappers (LocalStorage) ---
const getLocal = async <T>(key: string, defaultVal: T): Promise<T> => {
    try {
        const item = await localforage.getItem<T>(key);
        return item !== null ? item : defaultVal;
    } catch {
        return defaultVal;
    }
};

const setLocal = async (key: string, value: any) => {
    try {
        await localforage.setItem(key, value);
    } catch (e) {
        console.error('localforage setItem error:', e);
    }
};

// --- Password Hashing Helper ---
async function hashPassword(password: string): Promise<string> {
    if (!password) return '';
    if (password.length === 64 && /^[0-9a-f]{64}$/i.test(password)) return password;
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Supabase Mapping Helpers ---
const mapToSupabaseUser = async (user: User) => {
    const hashedPassword = user.profile.password ? await hashPassword(user.profile.password) : '';
    const profileWithoutCreds = { ...user.profile };
    delete profileWithoutCreds.username;
    delete profileWithoutCreds.password;
    
    return {
        id: user.id,
        role: user.role,
        username: user.profile.username,
        password: hashedPassword,
        profile: profileWithoutCreds,
        qrToken: user.qrToken,
        isActive: user.isActive !== false
    };
};

const mapFromSupabaseUser = (row: any): User => {
    return {
        id: row.id,
        role: row.role,
        profile: {
            ...row.profile,
            username: row.username,
            password: row.password 
        },
        qrToken: row.qrToken,
        isActive: row.isActive !== false
    };
};

// --- Business Logic Helpers ---
const recalculateUserHours = async (userId: string) => {
    let totalMinutes = 0;
    
    if (isSupabaseActive()) {
        const { data, error } = await supabase
            .from('attendance')
            .select('totalDailyMinutes')
            .eq('userId', userId);
            
        if (!error && data) {
            totalMinutes = data.reduce((acc, doc) => acc + (doc.totalDailyMinutes || 0), 0);
            
            // Fetch user to update profile
            const { data: userData } = await supabase.from('users').select('profile').eq('id', userId).single();
            if (userData && userData.profile) {
                const updatedProfile = { ...userData.profile, completedHours: totalMinutes };
                await supabase.from('users').update({ profile: updatedProfile }).eq('id', userId);
            }
        }
    } else {
        const records = await getLocal<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
        const userRecords = records.filter(r => r.userId === userId);
        totalMinutes = userRecords.reduce((acc, curr) => acc + curr.totalDailyMinutes, 0);

        // Update Student
        const students = await getLocal<User[]>(KEYS.STUDENTS, []);
        const studentIndex = students.findIndex(s => s.id === userId);
        if (studentIndex !== -1) {
            students[studentIndex].profile.completedHours = totalMinutes;
            await setLocal(KEYS.STUDENTS, students);
            return;
        }

        // Update Employee
        const employees = await getLocal<User[]>(KEYS.EMPLOYEES, []);
        const employeeIndex = employees.findIndex(e => e.id === userId);
        if (employeeIndex !== -1) {
            employees[employeeIndex].profile.completedHours = totalMinutes;
            await setLocal(KEYS.EMPLOYEES, employees);
            return;
        }

        // Update Admin
        const admins = await getLocal<User[]>(KEYS.ADMINS, []);
        const adminIndex = admins.findIndex(a => a.id === userId);
        if (adminIndex !== -1) {
            admins[adminIndex].profile.completedHours = totalMinutes;
            await setLocal(KEYS.ADMINS, admins);
            return;
        }
    }
};

export const api = {
    init: async () => {
        if (isSupabaseActive()) {
            console.log('TrackMyHours: Using Supabase backend');
            // Check if any admin exists
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('role', UserRole.ADMIN)
                .limit(1);
            
            if (!error && (!data || data.length === 0)) {
                console.log('Seeding default admins to Supabase...');
                const defaultAdmins: User[] = [
                    {
                        id: 'super-admin-default',
                        role: UserRole.SUPER_ADMIN,
                        profile: {
                            name: 'Super Administrator',
                            username: 'superadmin123',
                            password: '098765',
                            completedHours: 0
                        }
                    },
                    {
                        id: 'admin-default',
                        role: UserRole.ADMIN,
                        profile: {
                            name: 'Administrator',
                            username: 'admin123',
                            password: '123456',
                            completedHours: 0
                        }
                    }
                ];
                
                for (const admin of defaultAdmins) {
                    await supabase.from('users').upsert(await mapToSupabaseUser(admin));
                }
            }

            // Check if demo data exists
            const { data: demoData, error: demoError } = await supabase
                .from('users')
                .select('id')
                .eq('username', 'intern_alpha')
                .limit(1);

            if (!demoError && (!demoData || demoData.length === 0)) {
                console.log('Seeding rich dummy data to Supabase...');
                const dummy = generateDummyData();
                
                for (const student of dummy.students) {
                    await supabase.from('users').upsert(await mapToSupabaseUser(student));
                }
                for (const emp of dummy.employees) {
                    await supabase.from('users').upsert(await mapToSupabaseUser(emp));
                }
                for (const rec of dummy.attendanceRecords) {
                    await supabase.from('attendance_records').upsert(rec);
                }
            }
        } else {
            console.log('TrackMyHours: Using LocalStorage backend (Supabase credentials missing)');

            // --- Migration from localStorage to localforage ---
            for (const key of Object.values(KEYS)) {
                try {
                    const localItem = localStorage.getItem(key);
                    if (localItem) {
                        const parsed = JSON.parse(localItem);
                        const existingForage = await localforage.getItem(key);
                        if (!existingForage) {
                            console.log(`Migrating ${key} from localStorage to localforage...`);
                            await localforage.setItem(key, parsed);
                        }
                    }
                } catch (e) {
                    console.error('Migration error for', key, e);
                }
            }

            let admins = await getLocal<User[]>(KEYS.ADMINS, []);
            
            // Ensure default admins exist
            const defaultAdmins: User[] = [
                {
                    id: 'super-admin-default',
                    role: UserRole.SUPER_ADMIN,
                    profile: {
                        name: 'Super Administrator',
                        username: 'superadmin123',
                        password: '098765',
                        completedHours: 0
                    }
                },
                {
                    id: 'admin-default',
                    role: UserRole.ADMIN,
                    profile: {
                        name: 'Administrator',
                        username: 'admin123',
                        password: '123456',
                        completedHours: 0
                    }
                }
            ];

            let changed = false;
            defaultAdmins.forEach(defAdmin => {
                // Check by ID or Username to avoid duplicates if ID changed somehow
                const exists = admins.some(a => a.id === defAdmin.id || a.profile.username === defAdmin.profile.username);
                if (!exists) {
                    admins.push(defAdmin);
                    changed = true;
                }
            });

            if (changed) {
                console.log('Restoring missing default admins to LocalStorage...');
                await setLocal(KEYS.ADMINS, admins);
            } else if (admins.length === 0) {
                 // Fallback if somehow empty but loop didn't catch it (unlikely but safe)
                 console.log('Seeding default admins to LocalStorage...');
                 await setLocal(KEYS.ADMINS, defaultAdmins);
            }

            // Seed rich demo data for LocalStorage
            let students = await getLocal<User[]>(KEYS.STUDENTS, []);
            const demoExists = students.some(s => s.profile.username === 'intern_alpha');
            if (!demoExists) {
                console.log('Seeding rich dummy data to LocalStorage...');
                const dummy = generateDummyData();
                
                let existingStudents = await getLocal<User[]>(KEYS.STUDENTS, []);
                let existingEmployees = await getLocal<User[]>(KEYS.EMPLOYEES, []);
                let existingRecords = await getLocal<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
                let existingLogs = await getLocal<ActivityLog[]>(KEYS.LOGS, []);

                // append or just set if empty
                await setLocal(KEYS.STUDENTS, [...existingStudents, ...dummy.students]);
                await setLocal(KEYS.EMPLOYEES, [...existingEmployees, ...dummy.employees]);
                await setLocal(KEYS.ATTENDANCE, [...existingRecords, ...dummy.attendanceRecords]);
                await setLocal(KEYS.LOGS, [...existingLogs, ...dummy.logs]);
            }        }
    },

    auth: {
        login: async (username: string, password?: string): Promise<User | null> => {
            if (isSupabaseActive()) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .limit(1);
                
                if (error || !data || data.length === 0) return null;
                
                const user = mapFromSupabaseUser(data[0]);
                
                // If it's a Province Employee, no password check needed
                if (user.role === UserRole.EMPLOYEE && user.profile.employeeType === 'PROVINCE') {
                    return user;
                }
                
                // Otherwise, check password
                if (!password) return null;
                const hashedPassword = await hashPassword(password);
                if (data[0].password !== hashedPassword) return null;
                
                return user;
            } else {
                const allUsers = [
                    ...await getLocal<User[]>(KEYS.ADMINS, []),
                    ...await getLocal<User[]>(KEYS.STUDENTS, []),
                    ...await getLocal<User[]>(KEYS.EMPLOYEES, [])
                ];

                let user = allUsers.find(u => u.profile.username === username);
                
                if (user) {
                    if (user.role === UserRole.EMPLOYEE && user.profile.employeeType === 'PROVINCE') {
                        return user;
                    }
                    if (user.profile.password !== password) {
                        user = undefined;
                    }
                }
                
                // Recovery for Admin: If not found, try re-initializing defaults and check again
                if (!user) {
                     await api.init(); 
                     const admins = await getLocal<User[]>(KEYS.ADMINS, []);
                     user = admins.find(u => u.profile.username === username && u.profile.password === password);
                }

                return user || null;
            }
        },
        loginWithQR: async (token: string): Promise<User | null> => {
            if (isSupabaseActive()) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('qrToken', token)
                    .limit(1);
                
                if (error || !data || data.length === 0) return null;
                return mapFromSupabaseUser(data[0]);
            } else {
                const allUsers = [
                    ...await getLocal<User[]>(KEYS.ADMINS, []),
                    ...await getLocal<User[]>(KEYS.STUDENTS, []),
                    ...await getLocal<User[]>(KEYS.EMPLOYEES, [])
                ];
                return allUsers.find(u => u.qrToken === token) || null;
            }
        },
        register: async (user: User): Promise<boolean> => {
            if (isSupabaseActive()) {
                // Check uniqueness
                const { data: existingUsers } = await supabase
                    .from('users')
                    .select('id')
                    .eq('role', user.role)
                    .eq('username', user.profile.username);
                
                if (existingUsers && existingUsers.length > 0) {
                    return false;
                }

                try {
                    const mappedUser = await mapToSupabaseUser(user);
                    const { error } = await supabase.from('users').insert(mappedUser);
                    if (error) throw error;
                    return true;
                } catch (error) {
                    console.error('Registration insert error:', error);
                    return false;
                }
            } else {
                const admins = await getLocal<User[]>(KEYS.ADMINS, []);
                const students = await getLocal<User[]>(KEYS.STUDENTS, []);
                const employees = await getLocal<User[]>(KEYS.EMPLOYEES, []);
                
                const allUsernames = [
                    ...admins.map(a => a.profile.username),
                    ...students.map(s => s.profile.username),
                    ...employees.map(e => e.profile.username)
                ];

                if (allUsernames.includes(user.profile.username)) return false;

                if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
                    admins.push(user);
                    await setLocal(KEYS.ADMINS, admins);
                } else if (user.role === UserRole.STUDENT) {
                    students.push(user);
                    await setLocal(KEYS.STUDENTS, students);
                } else if (user.role === UserRole.EMPLOYEE) {
                    employees.push(user);
                    await setLocal(KEYS.EMPLOYEES, employees);
                }
                return true;
            }
        },
        resetPassword: async (username: string, newPassword?: string): Promise<{success: boolean, message: string}> => {
             if (isSupabaseActive()) {
                 const { data: existingUsers } = await supabase
                     .from('users')
                     .select('id')
                     .eq('username', username)
                     .limit(1);
                 
                 if (!existingUsers || existingUsers.length === 0) return { success: false, message: 'User not found' };
                 
                 if (newPassword) {
                     try {
                         const hashedPassword = await hashPassword(newPassword);
                         await supabase.from('users').update({ password: hashedPassword }).eq('id', existingUsers[0].id);
                         return { success: true, message: 'Password reset successfully' };
                     } catch (error) {
                         return { success: false, message: 'Failed to update password' };
                     }
                 }
                 return { success: true, message: 'User found' };
             } else {
                const allUsers = [
                    ...await getLocal<User[]>(KEYS.ADMINS, []),
                    ...await getLocal<User[]>(KEYS.STUDENTS, []),
                    ...await getLocal<User[]>(KEYS.EMPLOYEES, [])
                ];
                
                const user = allUsers.find(u => u.profile.username === username);
                
                if (!user) return { success: false, message: 'User not found' };
                
                if (newPassword) {
                    let key = '';
                    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) key = KEYS.ADMINS;
                    else if (user.role === UserRole.STUDENT) key = KEYS.STUDENTS;
                    else if (user.role === UserRole.EMPLOYEE) key = KEYS.EMPLOYEES;

                    const users = await getLocal<User[]>(key, []);
                    const idx = users.findIndex(u => u.id === user.id);
                    if (idx !== -1) {
                        users[idx].profile.password = newPassword;
                        await setLocal(key, users);
                    }
                    return { success: true, message: 'Password reset successfully' };
                }
                
                return { success: true, message: 'User found' };
             }
        }
    },

    students: {
        getAll: async () => { 
            if (isSupabaseActive()) {
                const { data } = await supabase.from('users').select('*').eq('role', UserRole.STUDENT);
                return (data || []).map(mapFromSupabaseUser);
            }
            return await getLocal<User[]>(KEYS.STUDENTS, []); 
        },
        add: async (user: User) => {
            if (isSupabaseActive()) {
                await supabase.from('users').insert(await mapToSupabaseUser(user));
            } else {
                const users = await getLocal<User[]>(KEYS.STUDENTS, []);
                users.push(user);
                await setLocal(KEYS.STUDENTS, users);
            }
            return user;
        },
        update: async (user: User) => {
            if (isSupabaseActive()) {
                await supabase.from('users').update(await mapToSupabaseUser(user)).eq('id', user.id);
            } else {
                const users = await getLocal<User[]>(KEYS.STUDENTS, []);
                const idx = users.findIndex(u => u.id === user.id);
                if (idx !== -1) {
                    users[idx] = user;
                    await setLocal(KEYS.STUDENTS, users);
                }
            }
            return user;
        },
        delete: async (id: string) => {
            if (isSupabaseActive()) {
                await supabase.from('users').delete().eq('id', id);
                await supabase.from('attendance').delete().eq('userId', id);
            } else {
                let users = await getLocal<User[]>(KEYS.STUDENTS, []);
                users = users.filter(u => u.id !== id);
                await setLocal(KEYS.STUDENTS, users);

                let records = await getLocal<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
                records = records.filter(r => r.userId !== id);
                await setLocal(KEYS.ATTENDANCE, records);
            }
        }
    },

    employees: {
        getAll: async () => { 
            if (isSupabaseActive()) {
                const { data } = await supabase.from('users').select('*').eq('role', UserRole.EMPLOYEE);
                return (data || []).map(mapFromSupabaseUser);
            }
            return await getLocal<User[]>(KEYS.EMPLOYEES, []); 
        },
        add: async (user: User) => {
            if (isSupabaseActive()) {
                await supabase.from('users').insert(await mapToSupabaseUser(user));
            } else {
                const users = await getLocal<User[]>(KEYS.EMPLOYEES, []);
                users.push(user);
                await setLocal(KEYS.EMPLOYEES, users);
            }
            return user;
        },
        update: async (user: User) => {
            if (isSupabaseActive()) {
                await supabase.from('users').update(await mapToSupabaseUser(user)).eq('id', user.id);
            } else {
                const users = await getLocal<User[]>(KEYS.EMPLOYEES, []);
                const idx = users.findIndex(u => u.id === user.id);
                if (idx !== -1) {
                    users[idx] = user;
                    await setLocal(KEYS.EMPLOYEES, users);
                }
            }
            return user;
        },
        delete: async (id: string) => {
            if (isSupabaseActive()) {
                await supabase.from('users').delete().eq('id', id);
                await supabase.from('attendance').delete().eq('userId', id);
            } else {
                let users = await getLocal<User[]>(KEYS.EMPLOYEES, []);
                users = users.filter(u => u.id !== id);
                await setLocal(KEYS.EMPLOYEES, users);

                let records = await getLocal<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
                records = records.filter(r => r.userId !== id);
                await setLocal(KEYS.ATTENDANCE, records);
            }
        }
    },

    admins: {
        getAll: async () => { 
            if (isSupabaseActive()) {
                const { data } = await supabase.from('users').select('*').in('role', [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
                return (data || []).map(mapFromSupabaseUser);
            }
            return await getLocal<User[]>(KEYS.ADMINS, []); 
        },
        update: async (user: User): Promise<{success: boolean, message?: string}> => {
            if (isSupabaseActive()) {
                const { error } = await supabase.from('users').update(await mapToSupabaseUser(user)).eq('id', user.id);
                if (error) {
                    if (error.code === '23505') return { success: false, message: 'Username already exists.' };
                    return { success: false, message: error.message };
                }
            } else {
                const users = await getLocal<User[]>(KEYS.ADMINS, []);
                const allUsers = [
                    ...await getLocal<User[]>(KEYS.ADMINS, []),
                    ...await getLocal<User[]>(KEYS.STUDENTS, []),
                    ...await getLocal<User[]>(KEYS.EMPLOYEES, [])
                ];
                if (allUsers.some(u => u.profile.username === user.profile.username && u.id !== user.id)) {
                    return { success: false, message: 'Username already exists.' };
                }
                const idx = users.findIndex(u => u.id === user.id);
                if (idx !== -1) {
                    users[idx] = user;
                    await setLocal(KEYS.ADMINS, users);
                }
            }
            return { success: true };
        }
    },

    attendance: {
        getAll: async () => { 
            if (isSupabaseActive()) {
                const { data } = await supabase.from('attendance').select('*');
                return (data || []) as AttendanceRecord[];
            }
            return await getLocal<AttendanceRecord[]>(KEYS.ATTENDANCE, []); 
        },
        save: async (record: AttendanceRecord) => {
            if (isSupabaseActive()) {
                try {
                    await supabase.from('attendance').upsert(record);
                } catch (error) {
                    console.error('Supabase save error:', error);
                }
            } else {
                const records = await getLocal<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
                const idx = records.findIndex(r => r.id === record.id);
                if (idx !== -1) records[idx] = record;
                else records.push(record);
                await setLocal(KEYS.ATTENDANCE, records);
            }
            
            await recalculateUserHours(record.userId);
            return record;
        }
    },

    logs: {
        getAll: async () => { 
            if (isSupabaseActive()) {
                const { data } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
                return (data || []) as ActivityLog[];
            }
            return await getLocal<ActivityLog[]>(KEYS.LOGS, []); 
        },
        add: async (log: ActivityLog) => {
             if (isSupabaseActive()) {
                 await supabase.from('logs').insert(log);
             } else {
                const logs = await getLocal<ActivityLog[]>(KEYS.LOGS, []);
                logs.unshift(log);
                await setLocal(KEYS.LOGS, logs);
             }
             return log;
        }
    },

    notifications: {
        getAll: async () => {
            if (isSupabaseActive()) {
                const { data } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
                return (data || []) as AppNotification[];
            }
            return await getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, []);
        },
        add: async (notification: AppNotification) => {
            if (isSupabaseActive()) {
                await supabase.from('notifications').insert(notification);
            } else {
                const notifications = await getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, []);
                notifications.unshift(notification);
                await setLocal(KEYS.NOTIFICATIONS, notifications);
            }
            return notification;
        },
        markAsRead: async (id: string) => {
            if (isSupabaseActive()) {
                await supabase.from('notifications').update({ isRead: true }).eq('id', id);
            } else {
                const notifications = await getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, []);
                const idx = notifications.findIndex(n => n.id === id);
                if (idx !== -1) {
                    notifications[idx].isRead = true;
                    await setLocal(KEYS.NOTIFICATIONS, notifications);
                }
            }
        },
        delete: async (id: string) => {
            if (isSupabaseActive()) {
                await supabase.from('notifications').delete().eq('id', id);
            } else {
                let notifications = await getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, []);
                notifications = notifications.filter(n => n.id !== id);
                await setLocal(KEYS.NOTIFICATIONS, notifications);
            }
        }
    },

    documents: {
        getAll: async () => {
            if (isSupabaseActive()) {
                const { data } = await supabase.from('documents').select('*').order('updatedAt', { ascending: false });
                return (data || []) as any[];
            }
            return await getLocal<any[]>(KEYS.DOCUMENTS, []);
        },
        save: async (doc: any) => {
            if (isSupabaseActive()) {
                await supabase.from('documents').upsert(doc);
            } else {
                const docs = await getLocal<any[]>(KEYS.DOCUMENTS, []);
                const idx = docs.findIndex(d => d.id === doc.id);
                if (idx !== -1) docs[idx] = doc;
                else docs.push(doc);
                await setLocal(KEYS.DOCUMENTS, docs);
            }
            return doc;
        },
        delete: async (id: string) => {
            if (isSupabaseActive()) {
                await supabase.from('documents').delete().eq('id', id);
            } else {
                let docs = await getLocal<any[]>(KEYS.DOCUMENTS, []);
                docs = docs.filter(d => d.id !== id);
                await setLocal(KEYS.DOCUMENTS, docs);
            }
        }
    },

    system: {
        exportData: async () => {
            return {
                students: await api.students.getAll(),
                employees: await api.employees.getAll(),
                admins: await api.admins.getAll(),
                attendance: await api.attendance.getAll(),
                logs: await api.logs.getAll()
            };
        },
        importData: async (data: any) => {
            if (isSupabaseActive()) {
                if (data.students) {
                    for (const u of data.students) await supabase.from('users').upsert(await mapToSupabaseUser(u));
                }
                if (data.employees) {
                    for (const u of data.employees) await supabase.from('users').upsert(await mapToSupabaseUser(u));
                }
                if (data.admins) {
                    for (const u of data.admins) await supabase.from('users').upsert(await mapToSupabaseUser(u));
                }
                if (data.attendance) {
                    for (const r of data.attendance) await supabase.from('attendance').upsert(r);
                }
                if (data.logs) {
                    for (const l of data.logs) await supabase.from('logs').upsert(l);
                }
            } else {
                if (data.students) await setLocal(KEYS.STUDENTS, data.students);
                if (data.employees) await setLocal(KEYS.EMPLOYEES, data.employees);
                if (data.admins) await setLocal(KEYS.ADMINS, data.admins);
                if (data.attendance) await setLocal(KEYS.ATTENDANCE, data.attendance);
                if (data.logs) await setLocal(KEYS.LOGS, data.logs);
            }
            return true;
        }
    }
};
