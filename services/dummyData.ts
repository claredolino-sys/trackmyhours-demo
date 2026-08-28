import { User, UserRole, StudentType, AttendanceRecord, ActivityLog } from '../types';

const blankPic = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const getRecentDates = (days: number) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Skip weekends
        if (d.getDay() !== 0 && d.getDay() !== 6) {
            dates.push(d.toISOString().split('T')[0]);
        }
    }
    return dates;
};

export const generateDummyData = () => {
    const dates = getRecentDates(5);
    const students: User[] = [
        {
            id: 'demo-student-alpha',
            role: UserRole.STUDENT,
            profile: {
                name: 'Intern Alpha',
                username: 'intern_alpha',
                password: 'password123',
                completedHours: 480,
                requiredHours: 600,
                studentType: StudentType.OJT,
                isActive: true,
                program: 'BS Computer Science',
                school: 'State University',
                profilePicture: blankPic
            }
        },
        {
            id: 'demo-student-beta',
            role: UserRole.STUDENT,
            profile: {
                name: 'Intern Beta',
                username: 'intern_beta',
                password: 'password123',
                completedHours: 240,
                requiredHours: 400,
                studentType: StudentType.IMMERSION,
                isActive: true,
                program: 'Information Technology',
                school: 'Tech Institute',
                profilePicture: blankPic
            }
        },
        {
            id: 'demo-student-gamma',
            role: UserRole.STUDENT,
            profile: {
                name: 'Intern Gamma',
                username: 'intern_gamma',
                password: 'password123',
                completedHours: 600,
                requiredHours: 600,
                studentType: StudentType.OJT,
                hoursApproved: true,
                isActive: true,
                program: 'Software Engineering',
                school: 'National College',
                profilePicture: blankPic
            }
        }
    ];

    const employees: User[] = [
        {
            id: 'demo-emp-1',
            role: UserRole.EMPLOYEE,
            profile: {
                name: 'Employee Delta',
                username: 'emp_delta',
                password: 'password123',
                completedHours: 0,
                isActive: true,
                department: 'Information Systems',
                position: 'Developer',
                employeeType: 'REGIONAL',
                profilePicture: blankPic
            }
        },
        {
            id: 'demo-emp-2',
            role: UserRole.EMPLOYEE,
            profile: {
                name: 'Employee Epsilon',
                username: 'emp_epsilon',
                password: 'password123',
                completedHours: 0,
                isActive: true,
                department: 'Field Operations',
                position: 'Technician',
                employeeType: 'PROVINCE',
                province: 'Region X',
                profilePicture: blankPic
            }
        }
    ];

    const attendanceRecords: AttendanceRecord[] = [];
    const logs: ActivityLog[] = [];

    const generateRecords = (user: User) => {
        dates.forEach((date, i) => {
            const isLate = i % 3 === 0;
            const record: AttendanceRecord = {
                id: `rec-${user.id}-${date}`,
                userId: user.id,
                date: date,
                amIn: isLate ? '08:30' : '08:00',
                amOut: '12:00',
                pmIn: '13:00',
                pmOut: '17:00',
                undertimeMinutes: isLate ? 30 : 0,
                totalDailyMinutes: isLate ? 450 : 480,
                isLocked: true,
                isPmDepartureLocked: false
            };
            attendanceRecords.push(record);
            
            logs.push({
                id: `log-${user.id}-${date}-in`,
                userId: user.id,
                action: `${user.profile.name} logged in.`,
                timestamp: new Date(`${date}T${isLate ? '08:30' : '08:00'}:00`).toISOString(),
                network: 'Demo Network'
            });
            logs.push({
                id: `log-${user.id}-${date}-out`,
                userId: user.id,
                action: `${user.profile.name} logged out.`,
                timestamp: new Date(`${date}T17:00:00`).toISOString(),
                network: 'Demo Network'
            });
        });
    };

    [...students, ...employees].forEach(generateRecords);

    return { students, employees, attendanceRecords, logs };
};
