/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'HOD' | 'Admin' | 'Supervisi' | 'Karyawan';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Laki-laki' | 'Perempuan';
  position: string; // Jabatan
  role: UserRole;
  status: 'Active' | 'Inactive';
  password?: string;
}

export interface Reply {
  id: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  timestamp: string;
}

export interface CoachingSession {
  id: string;
  employeeId: string;
  employeeName: string;
  coachId: string;
  coachName: string;
  topic: string;
  category: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  mode: 'Online' | 'Offline';
  meetingLink?: string; // MS Teams link
  roomName?: string; // One of 5 Rooms: Ruangan A - E
  reminderMinutes: number; // e.g. 15, 30, 60, 1440
  isCompleted: boolean;
  status: 'Scheduled' | 'Active' | 'Completed';
  notes?: string;
  followUp?: string[]; // Multiple choice options
  rating?: number; // 1-5 stars
  feedbackComment?: string;
  isAnonymous?: boolean;
  replies?: Reply[];
}

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
}
