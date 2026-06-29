import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, CoachingSession, Reply } from './types';
import { INITIAL_USERS, INITIAL_SESSIONS } from './initialData';
import { normalizeSession, normalizeSessions } from './sessionUtils';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import CoachingView from './components/CoachingView';
import HistoryView from './components/HistoryView';
import FeedbackView from './components/FeedbackView';
import UserManagementView from './components/UserManagementView';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [sessions, setSessions] = useState<CoachingSession[]>(INITIAL_SESSIONS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('jadwal');

  // Fetch sessions from backend on mount / when users change
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/jadwal');
      const data = await res.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        const mapped: CoachingSession[] = data.data.map((item: Record<string, unknown>) => ({
          id: String(item.id || item.schedule_id || ''),
          employeeId: String(item.employee_id || ''),
          employeeName: String(item.employee_name || item.employeeName || ''),
          coachId: String(item.coach_id || ''),
          coachName: String(item.coach_name || item.coachName || ''),
          topic: String(item.topic || ''),
          category: String(item.category_name || item.category || 'Umum'),
          date: String(item.scheduled_date || item.date || ''),
          startTime: String((item.start_time as string || '').substring(0, 5)),
          endTime: String((item.end_time as string || '').substring(0, 5)),
          mode: (item.mode === 'offline' ? 'Offline' : 'Online') as 'Online' | 'Offline',
          meetingLink: item.meet_link ? String(item.meet_link) : undefined,
          roomName: item.room_name ? String(item.room_name) : undefined,
          reminderMinutes: Number(item.reminder_minutes || 30),
          isCompleted: item.status === 'completed' || item.session_status === 'completed',
          status: item.session_status === 'ongoing' ? 'Active'
            : (item.status === 'done' || item.status === 'completed' || item.session_status === 'done') ? 'Completed' : 'Scheduled',
          notes: item.notes ? String(item.notes) : undefined,
          rating: item.rating ? Number(item.rating) : undefined,
          feedbackComment: item.feedback_comment ? String(item.feedback_comment) : undefined,
          isAnonymous: false,
          replies: [],
        }));
        setSessions(normalizeSessions(mapped, users));
      }
    } catch {
      // Backend not available — use local state (initial data)
    }
  }, [users]);

  // Fetch users from backend on mount
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('des_coach_token');
      if (!token) return;
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        const roleMap: Record<string, UserRole> = {
          hod: 'HOD', admin: 'Admin', supervisi: 'Supervisi', karyawan: 'Karyawan',
          HOD: 'HOD', Admin: 'Admin', Supervisi: 'Supervisi', Karyawan: 'Karyawan',
        };
        const mapped: User[] = data.data.map((u: Record<string, unknown>) => ({
          id: String(u.id),
          name: String(u.name || ''),
          email: String(u.email || ''),
          phone: String(u.phone || ''),
          gender: (u.gender as 'Laki-laki' | 'Perempuan') || 'Laki-laki',
          position: String(u.position || u.role || ''),
          role: roleMap[String(u.role || 'karyawan')] || 'Karyawan',
          status: (u.is_active === true || u.is_active === 1 || u.is_active === 't' || u.is_active === 'true') ? 'Active' : 'Inactive',
        }));
        setUsers(mapped);
      }
    } catch {
      // Backend not available — use INITIAL_USERS
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ─── AUTH ────────────────────────────────────────────────────────────
  const handleLogin = (user: User, token?: string) => {
    setCurrentUser(user);
    setActiveView(user.role === 'Admin' ? 'users' : 'jadwal');
    if (token) localStorage.setItem('des_coach_token', token);
    fetchUsers();
    fetchSessions();
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('des_coach_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore */ }
    localStorage.removeItem('des_coach_token');
    setCurrentUser(null);
    setActiveView('jadwal');
  };

  const handleUpdatePassword = async (email: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'local-reset', password_baru: newPassword }),
      });
      if (res.ok) return true;
    } catch { /* ignore */ }
    // Fallback: update local user state
    setUsers(prev => prev.map(u => u.email === email ? { ...u, password: newPassword } : u));
    return true;
  };

  // ─── USERS (CRUD) ────────────────────────────────────────────────────
  const handleAddUser = async (newUserData: Omit<User, 'id'>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('des_coach_token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserData.name,
          email: newUserData.email,
          password: newUserData.password || 'password123',
          role: newUserData.role,
          is_active: newUserData.status === 'Active',
        }),
      });
      const data = await res.json();
      if (data.status === 201) {
        await fetchUsers();
        return true;
      }
      alert(data.message || 'Gagal menambah user');
      return false;
    } catch {
      // Fallback to local state
      const id = `usr-${Date.now()}`;
      setUsers(prev => [...prev, { ...newUserData, id }]);
      return true;
    }
  };

  const handleUpdateUser = async (id: string, updatedFields: Partial<User>) => {
    try {
      const token = localStorage.getItem('des_coach_token');
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedFields.name,
          role: updatedFields.role,
          is_active: updatedFields.status === 'Active',
          password: updatedFields.password,
        }),
      });
      await fetchUsers();
    } catch {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedFields } : u));
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const token = localStorage.getItem('des_coach_token');
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUsers();
    } catch {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // ─── SESSIONS ────────────────────────────────────────────────────────
  const handleAddSession = async (
    newSession: CoachingSession
  ) => {
    try {
      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: newSession.employeeId,
          coach_id: newSession.coachId,
          topic: newSession.topic,
          category_id: 1,
          scheduled_date: newSession.date,
          start_time: newSession.startTime,
          end_time: newSession.endTime,
          mode: newSession.mode === 'Online' ? 'online' : 'offline',
          meet_link: newSession.meetingLink,
          room_id: newSession.roomName ? 1 : null,
          reminder_at: null,
          role: currentUser?.role || 'Karyawan',
        }),
      });
      const data = await res.json();
      if (data.status === 201) {
        await fetchSessions();
      } else {
        setSessions(prev => [...prev, newSession]);
      }
    } catch {
      setSessions(prev => [...prev, newSession]);
    }
  };

  const handleStartSession = async (id: string) => {
    try {
      const res = await fetch('/api/coaching/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: id }),
      });
      const data = await res.json();
      if (data.status === 210 || data.status === 200) {
        setSessions(prev => prev.map(s =>
          s.id === id ? { ...s, status: 'Active' as const } : s
        ));
        return;
      }
    } catch { /* ignore */ }
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'Active' as const } : s
    ));
  };

  const handleEndSession = async (id: string, notes: string, followUp: string[]): Promise<void> => {
    try {
      const res = await fetch('/api/coaching/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: id, notes, followups: followUp }),
      });
      await res.json();
    } catch { /* ignore */ }
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'Completed' as const, isCompleted: true, notes, followUp } : s
    ));
  };

  const handleSubmitFeedback = async (id: string, rating: number, comment: string, isAnonymous: boolean) => {
    // POST /api/feedback — endpoint to be created in backend
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: id, rating, comment, is_anonymous: isAnonymous }),
      });
    } catch { /* ignore */ }
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, rating, feedbackComment: comment, isAnonymous } : s
    ));
  };

  const handleUpdateSession = async (
    id: string,
    updates: Partial<CoachingSession>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/jadwal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.message || data.status === 200) {
        setSessions(prev => prev.map(s =>
          s.id === id ? normalizeSession({ ...s, ...updates }, users) : s
        ));
        return true;
      }
      alert(data.message || 'Gagal memperbarui jadwal');
      return false;
    } catch {
      setSessions(prev => prev.map(s =>
        s.id === id ? normalizeSession({ ...s, ...updates }, users) : s
      ));
      return true;
    }
  };

  const handleAddReply = async (sessionId: string, replyContent: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/feedback/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_id: sessionId,
          replied_by: currentUser.id,
          reply: replyContent,
        }),
      });
      const data = await res.json();
      if (data.status === 201 || data.status === 200) {
        const newReply: Reply = {
          id: `reply-${Date.now()}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          content: replyContent,
          timestamp: new Date().toISOString(),
        };
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            return { ...s, replies: [...(s.replies || []), newReply] };
          }
          return s;
        }));
      } else {
        alert('Gagal mengirim balasan: ' + (data.message || ''));
      }
    } catch {
      const newReply: Reply = {
        id: `reply-${Date.now()}`,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        content: replyContent,
        timestamp: new Date().toISOString(),
      };
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, replies: [...(s.replies || []), newReply] };
        }
        return s;
      }));
    }
  };

  // ─── QUICK ROLE SWITCHER (evaluator helper) ───────────────────────────
  const handleQuickChangeRole = (role: UserRole) => {
    const matchedUser = users.find(u => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setActiveView(role === 'Admin' ? 'users' : 'jadwal');
    }
  };

  // ─── RESET DATABASE ───────────────────────────────────────────────────
  const handleResetDatabase = async () => {
    if (!confirm('Reset semua data ke kondisi awal? Aksi ini tidak dapat dibatalkan.')) return;
    try {
      await fetch('/api/admin/reset-database', { method: 'POST' });
    } catch { /* ignore */ }
    setUsers(INITIAL_USERS);
    setSessions(INITIAL_SESSIONS);
  };

  // ─── VIEW ROUTER ─────────────────────────────────────────────────────
  const renderActiveView = () => {
    if (!currentUser) return null;
    switch (activeView) {
      case 'dashboard':
        return <DashboardView sessions={sessions} users={users} />;
      case 'users':
        return (
          <UserManagementView
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'jadwal':
        return (
          <CalendarView
            currentUser={currentUser}
            users={users}
            sessions={sessions}
            onAddSession={handleAddSession}
          />
        );
      case 'coaching':
        return (
          <CoachingView
            currentUser={currentUser}
            users={users}
            sessions={sessions}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onSubmitFeedback={handleSubmitFeedback}
            onUpdateSession={handleUpdateSession}
          />
        );
      case 'histori':
        return <HistoryView currentUser={currentUser} sessions={sessions} />;
      case 'feedback':
        return (
          <FeedbackView
            currentUser={currentUser}
            users={users}
            sessions={sessions}
            onAddReply={handleAddReply}
          />
        );
      default:
        return (
          <CalendarView
            currentUser={currentUser}
            users={users}
            sessions={sessions}
            onAddSession={handleAddSession}
          />
        );
    }
  };

  // UN-AUTHENTICATED ROUTE GUARD
  if (!currentUser) {
    return (
      <LoginView
        users={users}
        onLoginSuccess={handleLogin}
        onUpdateUserPassword={handleUpdatePassword}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden select-none">

      {/* VERTICAL SIDEBAR */}
      <Sidebar
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* TOP HEADER BAR */}
        <header className="bg-white/95 border-b border-slate-200/80 p-4 shrink-0 flex items-center justify-between z-20 backdrop-blur-sm shadow-xs">

          {/* Quick Role Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:inline">
              Akses Simulasi Peran:
            </span>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              {(['Admin', 'HOD', 'Supervisi', 'Karyawan'] as UserRole[]).map((role) => {
                const isActive = currentUser.role === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleQuickChangeRole(role)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDatabase}
              className="p-2 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-800 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Reset Database ke Default"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-slate-200/80 py-3.5 px-6 shrink-0 flex justify-between items-center text-[10px] text-slate-500 select-none">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>DESNET & Universitas Diponegoro © 2026. Hak Cipta Dilindungi Undang-Undang.</span>
          </div>
          <span className="font-mono text-slate-400 tracking-wider">DES-COACH PORTAL v1.0.0</span>
        </footer>

      </div>
    </div>
  );
}
