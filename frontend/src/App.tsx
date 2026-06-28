/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, CoachingSession, EmailNotification, UserRole, Reply } from './types';
import { INITIAL_USERS, INITIAL_SESSIONS } from './initialData';
import { normalizeSession, normalizeSessions } from './sessionUtils';

// Subcomponents import
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import UserManagementView from './components/UserManagementView';
import CalendarView from './components/CalendarView';
import CoachingView from './components/CoachingView';
import HistoryView from './components/HistoryView';
import FeedbackView from './components/FeedbackView';
import NotificationToast from './components/NotificationToast';

import { Sparkles, RefreshCw, MailCheck, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // 2. AUTHENTICATION & ROUTING STATE
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('descoach_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeView, setActiveView] = useState<string>('jadwal'); // defaults to schedule calendar

  // 1. DATA MASTER STATE
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);

  // Fetch data from API when user logs in
  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        try {
          const [usersRes, sessionsRes] = await Promise.all([
            fetch('/api/users'),
            fetch('/api/coaching' + (currentUser.role === 'Karyawan' ? `?userId=${currentUser.id}` : ''))
          ]);
          const usersData = await usersRes.json();
          const sessionsData = await sessionsRes.json();

          const fetchedUsers = usersData.status ? usersData.data : users;
          if (usersData.status) setUsers(fetchedUsers);
          if (sessionsData.status) {
            setSessions(normalizeSessions(sessionsData.data, fetchedUsers));
          }
        } catch (error) {
          console.error("Failed to fetch API data", error);
        }
      };
      fetchData();
    }
  }, [currentUser]);

  // local storage syncing removed for API integration


  // local storage syncing removed for API integration

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('descoach_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('descoach_current_user');
    }
  }, [currentUser]);

  // Adjust default view when role changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Admin') {
        setActiveView('users');
      } else if (currentUser.role === 'HOD') {
        setActiveView('dashboard');
      } else {
        setActiveView('jadwal');
      }
    }
  }, [currentUser?.role]);

  // Reset database helper for easy testing/evaluation
  const handleResetDatabase = () => {
    const confirmReset = window.confirm('Apakah Anda ingin menyetel ulang database ke kondisi default (reset data)?');
    if (confirmReset) {
      localStorage.removeItem('descoach_users');
      localStorage.removeItem('descoach_sessions');
      localStorage.removeItem('descoach_notifications');
      localStorage.removeItem('descoach_current_user');
      setUsers(INITIAL_USERS);
      setSessions(INITIAL_SESSIONS);
      setNotifications([]);
      setCurrentUser(null);
      alert('Database berhasil disetel ulang ke default.');
    }
  };

  // 3. ACTION HANDLERS
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdatePassword = (email: string, newPass: string) => {
    setUsers(prev => prev.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, password: newPass };
      }
      return u;
    }));
  };

  // CRUD User Management (Admin specific)
  const handleAddUser = async (userFields: Omit<User, 'id'>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFields)
      });
      const data = await res.json();
      if (data.status) {
        setUsers(prev => [...prev, data.data]);
      } else {
        alert('Gagal menambahkan user: ' + JSON.stringify(data.errors));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (id: string, updatedFields: Partial<User>) => {
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedFields } : u));
      if (currentUser && currentUser.id === id) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedFields } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
      setSessions(prev => prev.filter(s => s.employeeId !== id && s.coachId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Coaching Scheduling & Notifications dispatch
  const handleAddSession = async (
    newSession: CoachingSession, 
    emailNotif: { recipientEmail: string; subject: string; body: string }
  ) => {
    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
      const data = await res.json();
      if (data.status) {
        setSessions(prev => [normalizeSession({ ...newSession, ...data.data }, users), ...prev]);
        
        // Simulating email notification read in UI
        const newNotification: EmailNotification = {
          id: `notif-${Date.now()}`,
          recipientEmail: emailNotif.recipientEmail,
          subject: emailNotif.subject,
          body: emailNotif.body,
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
      } else {
        alert(data.message || 'Gagal membuat jadwal coaching');
      }
    } catch (err) {
      console.error(err);
      alert('Koneksi server gagal');
    }
  };

  // Active Session flow
  const handleStartSession = async (id: string) => {
    try {
      await fetch(`/api/coaching/${id}/start`, { method: 'PUT' });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'Active' } : s));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndSession = async (id: string, notesContent: string, followUpTracks: string[]) => {
    try {
      await fetch(`/api/coaching/${id}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesContent, followUp: followUpTracks })
      });
      setSessions(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, status: 'Completed', isCompleted: true, notes: notesContent, followUp: followUpTracks };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Rating & Review (Karyawan)
  const handleSubmitFeedback = async (id: string, ratingStars: number, feedbackCommentText: string, anon: boolean) => {
    try {
      await fetch(`/api/coaching/${id}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingStars, feedbackComment: feedbackCommentText, isAnonymous: anon })
      });
      setSessions(prev => prev.map(s => {
        if (s.id === id) {
          return { ...s, rating: ratingStars, feedbackComment: feedbackCommentText, isAnonymous: anon, replies: [] };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Replies (HOD specific)
  const handleAddReply = async (sessionId: string, replyContent: string) => {
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/feedback/reply/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUser.id, content: replyContent })
      });
      
      const data = await res.json();
      
      if (data.status) {
        const newReply: Reply = {
          id: data.data.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          content: replyContent,
          timestamp: data.data.timestamp
        };

        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            const currentReplies = s.replies || [];
            return { ...s, replies: [...currentReplies, newReply] };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // simulated email log cleanup utilities
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Prototype fast-switcher for evaluator testing
  const handleQuickChangeRole = (role: UserRole) => {
    const matchedUser = users.find(u => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }
  };

  // View Router selector
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
            sessions={sessions}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onSubmitFeedback={handleSubmitFeedback}
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
        return <CalendarView currentUser={currentUser} users={users} sessions={sessions} onAddSession={handleAddSession} />;
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
      
      {/* VERTICAL SIDEBAR COMPONENT */}
      <Sidebar 
        currentUser={currentUser} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout}
      />

      {/* CORE FRAMEWORK CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP UTILITY HEADER BAR */}
        <header className="bg-white/95 border-b border-slate-200/80 p-4 shrink-0 flex items-center justify-between z-20 backdrop-blur-sm shadow-xs">
          
          {/* Quick Role Switcher (For high-fidelity evaluation) */}
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

          {/* Action Logs & Notification Toast Triggers */}
          <div className="flex items-center gap-3">
            {/* Email Toast Logs */}
            <NotificationToast 
              notifications={notifications}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onClearAll={handleClearAllNotifications}
            />

            <span className="text-slate-200 select-none">|</span>

            {/* Reset Database Tool (Evaluator helper) */}
            <button
              onClick={handleResetDatabase}
              className="p-2 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-800 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Reset Database ke Default"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </header>

        {/* COMPONENT PORT VIEW CONTAINER */}
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

        {/* BOTTOM LEGAL CREDITS STATUS INDICATOR */}
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
