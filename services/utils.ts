import { ALLOWED_WIFI } from '../constants';

export const calculateMinutes = (start: string, end: string): number => {
  if (!start || !end) return 0;
  
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  const startDate = new Date(0, 0, 0, startH, startM);
  const endDate = new Date(0, 0, 0, endH, endM);
  
  const diff = (endDate.getTime() - startDate.getTime()) / 1000 / 60;
  return diff > 0 ? diff : 0;
};

export const formatMinutesToHours = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export const getMonthName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'long' });
};

export const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

export const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

export const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const date = new Date(0, 0, 0, h, m);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hours = h % 12 || 12;
    return `${hours}:${m.toString().padStart(2, '0')} ${period}`;
};

export const formatTime12HourNoPeriod = (time24: string): string => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const hours = h % 12 || 12;
    return `${hours}:${m.toString().padStart(2, '0')}`;
};

export const parseTime = (val: any): string => {
    if (!val) return '';
    const str = String(val).trim();
    
    // Handle "08:00" or "8:00" (24-hour)
    if (/^\d{1,2}:\d{2}$/.test(str)) {
        const [h, m] = str.split(':').map(Number);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    
    // Handle "8:00 AM" or "08:00 PM" (12-hour)
    // Also handles "8 AM" or "8 PM" (without minutes)
    const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/i);
    if (match) {
        let [_, h, m, ap] = match;
        let hour = parseInt(h, 10);
        const minutes = m ? m : '00';
        const isPM = ap.toUpperCase() === 'PM';
        
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return str;
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

export const detectNetwork = async (): Promise<{ name: string, ip: string, isAllowed: boolean }> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const ip = data.ip;
        
        // For portfolio/demo purposes, we bypass the strict IP check
        // so interviewers can access the app from anywhere without being locked out.
        // We simulate a successful connection to a verified network.
        return { name: 'Demo Verified Network', ip, isAllowed: true };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn("Network detection timed out.");
        } else {
            console.error("Failed to detect network:", error);
        }
        // Fallback to allow access even if ipify fails
        return { name: 'Demo Verified Network', ip: '192.168.1.1', isAllowed: true };
    }
};