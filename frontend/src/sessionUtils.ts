/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoachingSession, Reply, User } from './types';

function parseFollowUp(followUp: CoachingSession['followUp']): string[] | undefined {
  if (followUp == null) return undefined;
  if (Array.isArray(followUp)) return followUp;
  if (typeof followUp === 'string') {
    try {
      const parsed = JSON.parse(followUp);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function toBoolean(value: unknown): boolean {
  if (value === true || value === 1 || value === '1' || value === 't' || value === 'true') return true;
  return false;
}

function parseReplies(replies: CoachingSession['replies']): Reply[] | undefined {
  if (!replies || !Array.isArray(replies)) return undefined;
  return replies;
}

export function normalizeSession(session: CoachingSession, users: User[]): CoachingSession {
  const employee = users.find(u => u.id === session.employeeId);
  const coach = users.find(u => u.id === session.coachId);

  return {
    ...session,
    employeeName: session.employeeName || employee?.name || 'Karyawan',
    coachName: session.coachName || coach?.name || 'Coach',
    isCompleted: toBoolean(session.isCompleted) || session.status === 'Completed',
    isAnonymous: toBoolean(session.isAnonymous),
    followUp: parseFollowUp(session.followUp),
    replies: parseReplies(session.replies),
  };
}

export function normalizeSessions(sessions: CoachingSession[], users: User[]): CoachingSession[] {
  return sessions.map(session => normalizeSession(session, users));
}
