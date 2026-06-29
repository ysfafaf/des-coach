/**
 * Type definitions — adapted from duplicate branch for otherproject backend.
 * Key adaptations:
 * - user.status maps to/from server's is_active boolean
 * - session fields mapped from schedules + coaching_sessions joined tables
 */

export type UserRole = 'HOD' | 'Admin' | 'Supervisi' | 'Karyawan';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Laki-laki' | 'Perempuan';
  position: string;
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
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:MM
  endTime: string;      // HH:MM
  mode: 'Online' | 'Offline';
  meetingLink?: string;
  roomName?: string;
  reminderMinutes: number;
  isCompleted: boolean;
  status: 'Scheduled' | 'Active' | 'Completed';
  notes?: string;
  followUp?: string[];
  rating?: number;
  feedbackComment?: string;
  isAnonymous?: boolean;
  replies?: Reply[];
}
