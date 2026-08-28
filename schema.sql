-- SQL Schema for TrackMyHours (Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile JSONB NOT NULL,
    "qrToken" TEXT UNIQUE
);

-- 2. Attendance Records Table
CREATE TABLE attendance (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    "amIn" TEXT,
    "amOut" TEXT,
    "pmIn" TEXT,
    "pmOut" TEXT,
    "undertimeMinutes" INTEGER DEFAULT 0,
    "totalDailyMinutes" INTEGER DEFAULT 0,
    "isLocked" BOOLEAN DEFAULT FALSE,
    "isPmDepartureLocked" BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    "remarksHours" NUMERIC,
    "amRemarks" TEXT,
    "pmRemarks" TEXT,
    "isMerged" BOOLEAN DEFAULT FALSE
);

-- 3. Notifications Table
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    location JSONB,
    "isRead" BOOLEAN DEFAULT FALSE,
    "attendanceRecordId" TEXT REFERENCES attendance(id) ON DELETE SET NULL
);

-- 4. Activity Logs Table
CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    location JSONB,
    network TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for users" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for logs" ON logs FOR ALL USING (true) WITH CHECK (true);

