
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  STUDENT = 'STUDENT',
  EMPLOYEE = 'EMPLOYEE'
}

export enum StudentType {
  OJT = 'OJT',
  IMMERSION = 'IMMERSION'
}

export interface UserProfile {
  name: string;
  username: string; // Replaced email
  password?: string; // Added for student/employee login
  school?: string;
  schoolAddress?: string;
  program?: string; // e.g. BS Computer Science
  studentType?: StudentType;
  // Employee specific fields
  position?: string;
  department?: string;
  employeeType?: 'REGIONAL' | 'PROVINCE';
  province?: string;
  
  requiredHours?: number;
  completedHours: number; // In minutes
  hoursApproved?: boolean; // Admin approval for completed hours
  dateStarted?: string; // YYYY-MM-DD format
  profilePicture?: string; // Base64 biometric enrollment
  certificateLink?: string; // Link to the certificate of completion
}

export interface User {
  id: string;
  role: UserRole;
  profile: UserProfile;
  qrToken?: string; // For QR code login
  isActive?: boolean; // For archiving accounts
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amIn: string; // HH:MM
  amOut: string; // HH:MM
  pmIn: string; // HH:MM
  pmOut: string; // HH:MM
  undertimeMinutes: number;
  totalDailyMinutes: number;
  isLocked: boolean; // If true, cannot undo
  isPmDepartureLocked: boolean; // If true, PM departure is disabled by admin
  remarks?: string; // For holidays, travel, etc.
  remarksHours?: number; // Equivalent hours for the remarks
  amRemarks?: string; // Specific remarks for AM session (e.g. "HALF DAY")
  pmRemarks?: string; // Specific remarks for PM session
  isMerged?: boolean; // If true, time columns are hidden and remarks span the row
  calendarNote?: string; // Note text added from calendar
  calendarRemark?: 'Did not Attend' | 'Cancelled' | 'Postponed'; // Remark selection from calendar
  calendarColor?: string; // Color marking for the calendar note
}

export interface AppNotification {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: 'MESSAGE' | 'PHOTO_UPLOAD';
  message: string;
  timestamp: string;
  isRead: boolean;
  attendanceRecordId?: string;
  attachment?: {
    name: string;
    type: string;
    data: string;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  location?: { lat: number; lng: number };
  network?: string;
}

export interface DocumentLink {
  id: string;
  userId?: string; // If assigned to a specific user (employee)
  targetGroup?: 'ALL' | 'REGIONAL' | 'PROVINCE'; // If assigned to a group of employees
  category: string;
  documentType: string;
  url: string;
  updatedAt: string;
}

export const ADMIN_IN_CHARGE = "Demo In-Charge";
