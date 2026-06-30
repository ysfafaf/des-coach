import React, { useState, useEffect, useRef } from 'react';
import { User, CoachingSession } from '../types';
import { TOP_TOPICS, MEETING_ROOMS } from '../initialData';
import {
  Play, Square, Clock, MapPin, Video, FileText, CheckSquare,
  Star, Smile, EyeOff, Eye, AlertCircle, Users, Edit2, X, Save, ArrowRightLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FOLLOW_UP_OPTIONS = [
  'Lanjutkan pembahasan di sesi berikutnya',
  'Karyawan perlu mengikuti pelatihan tambahan',
  'Buat rencana aksi tertulis dalam 1 minggu',
  'Perlu koordinasi dengan tim HRD',
  'Monitoring berkala setiap 2 minggu',
  'Referral ke konselor profesional',
  'Tidak ada tindak lanjut diperlukan',
];

interface CoachingViewProps {
  currentUser: User;
  users: User[];
  sessions: CoachingSession[];
  onStartSession: (id: string) => void;
  onEndSession: (id: string, notes: string, followUp: string[]) => Promise<void>;
  onSubmitFeedback: (id: string, rating: number, comment: string, isAnonymous: boolean) => void;
  onUpdateSession: (
    id: string,
    updates: Partial<CoachingSession>
  ) => Promise<boolean>;
}

export default function CoachingView({
  currentUser, users, sessions,
  onStartSession, onEndSession, onSubmitFeedback, onUpdateSession,
}: CoachingViewProps) {
  const isCoach = currentUser.role === 'Supervisi' || currentUser.role === 'HOD';
  const isHOD = currentUser.role === 'HOD';
  const isEmployee = currentUser.role === 'Karyawan';
  const supervisiList = users.filter(u => u.role === 'Supervisi' && u.status === 'Active');

  const [activeSessId, setActiveSessId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedFollowUps, setSelectedFollowUps] = useState<string[]>([]);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingSession, setEditingSession] = useState<CoachingSession | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editCategory, setEditCategory] = useState(TOP_TOPICS[0]);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editMode, setEditMode] = useState<'Online' | 'Offline'>('Online');
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [editRoomName, setEditRoomName] = useState(MEETING_ROOMS[0]);
  const [reassignToSupervisi, setReassignToSupervisi] = useState(false);
  const [selectedSupervisiId, setSelectedSupervisiId] = useState('');

  const mySessions = sessions.filter(s => {
    if (isCoach) return s.coachId === currentUser.id;
    if (isEmployee) return s.employeeId === currentUser.id;
    return false;
  });

  const upcomingSessions = mySessions.filter(s => s.status === 'Scheduled');
  const activeSessions = mySessions.filter(s => s.status === 'Active');
  const awaitingFeedbackSessions = mySessions.filter(s => s.isCompleted && !s.feedbackComment && isEmployee);

  // Timer logic
  useEffect(() => {
    if (!activeSessId && activeSessions.length > 0) {
      setActiveSessId(activeSessions[0].id);
    }
  }, [activeSessions, activeSessId]);

  useEffect(() => {
    if (activeSessId) {
      timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSessId]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStart = (id: string) => {
    onStartSession(id);
    setActiveSessId(id);
  };

  const handleEndSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    await onEndSession(id, notes, selectedFollowUps);
    setActiveSessId(null);
    setNotes('');
    setSelectedFollowUps([]);
  };

  const handleFollowUpToggle = (option: string) => {
    setSelectedFollowUps(prev =>
      prev.includes(option) ? prev.filter(f => f !== option) : [...prev, option]
    );
  };

  const handleFeedbackSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    onSubmitFeedback(id, rating, comment, isAnonymous);
    setFeedbackSessionId(null);
    setRating(5);
    setComment('');
    setIsAnonymous(false);
    alert('Feedback Anda berhasil dikirim. Terima kasih atas penilaiannya!');
  };

  const handleOpenEdit = (session: CoachingSession) => {
    setEditingSession(session);
    setEditTopic(session.topic);
    setEditCategory(session.category);
    setEditDate(session.date);
    setEditStartTime(session.startTime);
    setEditEndTime(session.endTime);
    setEditMode(session.mode);
    setEditMeetingLink(session.meetingLink || '');
    setEditRoomName(session.roomName || MEETING_ROOMS[0]);
    setReassignToSupervisi(false);

    const firstSpv = users.find(u => u.role === 'Supervisi');
    setSelectedSupervisiId(firstSpv ? firstSpv.id : '');
  };

  const handleCloseEdit = () => {
    setEditingSession(null);
    setReassignToSupervisi(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    const updates: Partial<CoachingSession> = {
      topic: editTopic,
      category: editCategory,
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      mode: editMode,
      meetingLink: editMode === 'Online' ? editMeetingLink : undefined,
      roomName: editMode === 'Offline' ? editRoomName : undefined,
    };

    if (reassignToSupervisi && selectedSupervisiId) {
      const newCoach = users.find(u => u.id === selectedSupervisiId);
      if (newCoach) {
        updates.coachId = newCoach.id;
        updates.coachName = newCoach.name;
      }
    }

    const targetCoach = users.find(u => u.id === (updates.coachId || editingSession.coachId));

    const ok = await onUpdateSession(editingSession.id, updates);
    if (ok) handleCloseEdit();
  };

  const sessionStatusBadge = (s: CoachingSession) => {
    if (s.isCompleted || s.status === 'Completed')
      return <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">Selesai</span>;
    if (s.status === 'Active')
      return <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold animate-pulse">Berlangsung</span>;
    return <span className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full font-semibold">Terjadwal</span>;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-900" /> Sesi Coaching
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isCoach ? 'Kelola dan mulai sesi coaching bersama karyawan Anda.' : 'Pantau sesi coaching Anda dan berikan rating setelah sesi selesai.'}
        </p>
      </div>

      {/* ACTIVE SESSION TIMER (Coach) */}
      {isCoach && activeSessions.length > 0 && activeSessId && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sesi Sedang Berlangsung</span>
            </div>
            <span className="text-2xl font-black font-mono text-slate-900">{formatTimer(elapsedSeconds)}</span>
          </div>
          {activeSessions.filter(s => s.id === activeSessId).map(session => (
            <div key={session.id}>
              <p className="text-xs text-slate-700 font-semibold">{session.topic}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Karyawan: {session.employeeName}</p>

              <form onSubmit={(e) => handleEndSubmit(e, session.id)} className="mt-4 space-y-4">
                <div>
                  <label className="block text-slate-800 text-xs font-semibold mb-1">Catatan Sesi (Ringkasan)</label>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none resize-none focus:border-amber-400"
                    rows={3}
                    placeholder="Tulis ringkasan pembahasan sesi ini..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-800 text-xs font-semibold mb-2">Tindak Lanjut (Follow-up)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FOLLOW_UP_OPTIONS.map(opt => (
                      <label key={opt} className="flex items-start gap-2 cursor-pointer text-xs text-slate-800">
                        <input
                          type="checkbox"
                          className="mt-0.5 w-3.5 h-3.5 cursor-pointer"
                          checked={selectedFollowUps.includes(opt)}
                          onChange={() => handleFollowUpToggle(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  <Square className="w-3.5 h-3.5" /> Akhiri Sesi Coaching
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* SESSION LIST */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            {isCoach ? 'Daftar Sesi Coaching Anda' : 'Sesi Coaching Saya'}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isCoach
              ? 'Menampilkan sesi yang belum selesai.'
              : 'Menampilkan sesi aktif dan sesi yang menunggu ulasan Anda.'}
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {(() => {
            const displaySessions = mySessions.filter(s => {
              if (s.status !== 'Completed' && !s.isCompleted) return true;
              if (isEmployee && !s.feedbackComment) return true;
              return false;
            });

            if (displaySessions.length === 0) {
              return (
                <div className="p-10 text-center text-slate-400 italic text-xs">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  Tidak ada sesi coaching terkait akun Anda.
                </div>
              );
            }

            return displaySessions.map(session => (
              <div key={session.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-900">{session.topic}</span>
                      {sessionStatusBadge(session)}
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p>{isCoach ? `Karyawan: ${session.employeeName}` : `Coach: ${session.coachName}`}</p>
                      <p className="font-mono">{session.date} · {session.startTime}–{session.endTime}</p>
                      <p className="flex items-center gap-1">
                        {session.mode === 'Online'
                          ? <><Video className="w-3 h-3" /> Online (Teams)</>
                          : <><MapPin className="w-3 h-3" /> Offline — {session.roomName}</>}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    {/* Coach: Edit & Start */}
                    {isCoach && session.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(session)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleStart(session.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                        >
                          <Play className="w-3 h-3" /> Mulai Sesi
                        </button>
                      </>
                    )}

                    {/* Employee: Give Feedback */}
                    {isEmployee && (session.isCompleted || session.status === 'Completed') && !session.feedbackComment && (
                      <button
                        onClick={() => setFeedbackSessionId(session.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                      >
                        <Star className="w-3 h-3" /> Beri Rating
                      </button>
                    )}

                    {/* Rating badge if already rated */}
                    {session.rating && (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="text-[10px] font-bold font-mono">{session.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes if completed */}
                {session.notes && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Catatan Sesi
                    </p>
                    <p className="text-xs text-slate-700">{session.notes}</p>
                  </div>
                )}
                {session.followUp && session.followUp.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {session.followUp.map((f, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                        <CheckSquare className="w-2.5 h-2.5 inline mr-0.5" />{f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      <AnimatePresence>
        {feedbackSessionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setFeedbackSessionId(null)}
            />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smile className="w-4 h-4" /> Berikan Rating Sesi
                </h3>
                <button onClick={() => setFeedbackSessionId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleFeedbackSubmit(e, feedbackSessionId)} className="p-6 space-y-5">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-3 text-center">Rating Bintang</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-slate-500 mt-2 font-semibold">
                    {rating === 5 ? 'Sangat Puas' : rating === 4 ? 'Puas' : rating === 3 ? 'Cukup' : rating === 2 ? 'Kurang' : 'Tidak Puas'}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">Komentar (Opsional)</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none resize-none focus:bg-white focus:border-slate-400"
                    rows={3}
                    placeholder="Bagikan pengalaman sesi coaching Anda..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span className="flex items-center gap-1">
                    {isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    Kirim sebagai Anonim
                  </span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setFeedbackSessionId(null)}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer">
                    Batal
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Kirim Rating
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SESSION MODAL */}
      <AnimatePresence>
        {editingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={handleCloseEdit}
            />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Jadwal Sesi
                </h3>
                <button onClick={handleCloseEdit} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    <p className="text-slate-500">Karyawan: <span className="font-semibold text-slate-900">{editingSession.employeeName}</span></p>
                    <p className="text-slate-400">Coach saat ini: {editingSession.coachName}</p>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Topik Sesi</label>
                    <input type="text" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400"
                      value={editTopic} onChange={(e) => setEditTopic(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Kategori</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none cursor-pointer"
                      value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                      {TOP_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Tanggal</label>
                      <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none"
                        value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Jam Mulai</label>
                      <input type="time" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none"
                        value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Jam Selesai</label>
                      <input type="time" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none"
                        value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Metode Sesi</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none cursor-pointer"
                      value={editMode} onChange={(e) => setEditMode(e.target.value as 'Online' | 'Offline')}>
                      <option value="Online">Online (Teams)</option>
                      <option value="Offline">Offline (Ruangan)</option>
                    </select>
                  </div>

                  {editMode === 'Online' ? (
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Link Meeting</label>
                      <input type="url" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none"
                        value={editMeetingLink} onChange={(e) => setEditMeetingLink(e.target.value)} />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Ruangan</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none cursor-pointer"
                        value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)}>
                        {MEETING_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}

                  {isHOD && (
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input type="checkbox" className="w-4 h-4 rounded mt-0.5 cursor-pointer"
                          checked={reassignToSupervisi}
                          onChange={(e) => setReassignToSupervisi(e.target.checked)} />
                        <div>
                          <span className="text-slate-700 text-xs font-bold flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5" /> Alihkan ke Supervisi
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Centang jika jadwal perlu ditangani oleh supervisi lain karena Anda tidak tersedia.
                          </span>
                        </div>
                      </label>
                      {reassignToSupervisi && (
                        <div>
                          <label className="block text-slate-600 text-xs font-semibold mb-1">Pilih Supervisi</label>
                          <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none cursor-pointer"
                            value={selectedSupervisiId} onChange={(e) => setSelectedSupervisiId(e.target.value)}>
                            {supervisiList.length === 0
                              ? <option value="">Tidak ada supervisi tersedia</option>
                              : supervisiList.map(spv => (
                                <option key={spv.id} value={spv.id}>{spv.name} — {spv.position}</option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={handleCloseEdit}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer">
                      Batal
                    </button>
                    <button type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
