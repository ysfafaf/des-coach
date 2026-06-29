import React, { useState } from 'react';
import { User, CoachingSession } from '../types';
import {
  History, Search, MapPin, Video, Star, FileText,
  MessageSquare, X, CheckCircle2, TrendingUp, UserCheck, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOP_TOPICS } from '../initialData';

interface HistoryViewProps {
  currentUser: User;
  sessions: CoachingSession[];
}

export default function HistoryView({ currentUser, sessions }: HistoryViewProps) {
  const isHOD = currentUser.role === 'HOD';
  const isSupervisi = currentUser.role === 'Supervisi';
  const isKaryawan = currentUser.role === 'Karyawan';
  const [hodTab, setHodTab] = useState<'your' | 'other'>('your');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null);
  const [modalType, setModalType] = useState<'notes' | 'feedback' | null>(null);

  const completedSessions = sessions.filter(s => s.isCompleted || s.status === 'Completed');

  const getVisibleSessions = () => {
    let visible: CoachingSession[] = [];
    if (isHOD) {
      if (hodTab === 'your') {
        visible = completedSessions.filter(s => s.coachId === currentUser.id);
      } else {
        visible = completedSessions.filter(s => s.coachId !== currentUser.id);
      }
    } else if (isSupervisi) {
      visible = completedSessions.filter(s => s.coachId === currentUser.id);
    } else if (isKaryawan) {
      visible = completedSessions.filter(s => s.employeeId === currentUser.id);
    }

    if (categoryFilter !== 'Semua') {
      visible = visible.filter(s => s.category === categoryFilter || s.topic === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      visible = visible.filter(s =>
        s.topic.toLowerCase().includes(q) ||
        s.employeeName.toLowerCase().includes(q) ||
        s.coachName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return visible.sort((a, b) => b.date.localeCompare(a.date));
  };

  const visibleSessions = getVisibleSessions();

  const handleOpenModal = (session: CoachingSession, type: 'notes' | 'feedback') => {
    setSelectedSession(session);
    setModalType(type);
  };
  const handleCloseModal = () => { setSelectedSession(null); setModalType(null); };

  const avgRating = visibleSessions.length > 0
    ? (visibleSessions.reduce((acc, s) => acc + Number(s.rating || 0), 0) / visibleSessions.filter(s => s.rating).length || 0)
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-slate-900" /> Histori Coaching
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Riwayat lengkap sesi coaching yang telah selesai dilaksanakan.
        </p>
      </div>

      {/* HOD Tab */}
      {isHOD && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
          {(['your', 'other'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setHodTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                hodTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'your' ? '👤 Sesi Saya' : '👥 Sesi Coach Lain'}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sesi Selesai', value: visibleSessions.length, icon: CheckCircle2 },
          { label: 'Sesi Dengan Feedback', value: visibleSessions.filter(s => s.feedbackComment).length, icon: MessageSquare },
          { label: 'Rata-rata Rating', value: avgRating > 0 ? avgRating.toFixed(1) + ' ★' : '—', icon: Star },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-500 font-medium">{stat.label}</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari topik, karyawan, atau coach..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100 transition-all placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-700 outline-none focus:border-slate-400 cursor-pointer font-medium"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="Semua">Semua Kategori</option>
            {TOP_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Session Cards */}
      {visibleSessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-xs italic">Belum ada histori sesi yang sesuai dengan filter Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((session) => (
            <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-bold text-slate-900">{session.topic}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">Selesai</span>
                    {session.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= session.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {isKaryawan ? `Coach: ${session.coachName}` : `Karyawan: ${session.employeeName}`}</span>
                    <span className="font-mono">{session.date} · {session.startTime}–{session.endTime}</span>
                    <span className="flex items-center gap-1">
                      {session.mode === 'Online'
                        ? <><Video className="w-3 h-3" /> Online (Teams)</>
                        : <><MapPin className="w-3 h-3" /> Offline — {session.roomName}</>}
                    </span>
                    <span className="text-slate-400">{session.category}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenModal(session, 'notes')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Catatan
                  </button>
                  {!isSupervisi && (session.feedbackComment || isHOD) && (
                    <button
                      onClick={() => handleOpenModal(session, 'feedback')}
                      disabled={!session.feedbackComment}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Ulasan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {selectedSession && modalType && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-slate-900 text-sm font-bold flex items-center gap-2">
                  {modalType === 'notes'
                    ? <><FileText className="w-4 h-4 text-slate-800" /> Catatan Evaluasi Coach</>
                    : <><MessageSquare className="w-4 h-4 text-slate-800" /> Ulasan Kepuasan Karyawan</>}
                </h3>
                <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="text-slate-500">Sesi: <span className="font-semibold text-slate-900">{selectedSession.topic}</span></p>
                  <p className="text-slate-400">Tanggal: {selectedSession.date} · Coach: {selectedSession.coachName}</p>
                </div>

                {modalType === 'notes' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Bimbingan</span>
                      <p className="text-slate-800 text-xs leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {selectedSession.notes || 'Tidak ada catatan tertulis.'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tindak Lanjut yang Disetujui</span>
                      {selectedSession.followUp && selectedSession.followUp.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedSession.followUp.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs italic">Sesi selesai tanpa tindak lanjut tambahan.</p>
                      )}
                    </div>
                  </div>
                )}

                {modalType === 'feedback' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">Skor Rating</span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= (selectedSession.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Komentar & Ulasan</span>
                      <p className="text-slate-800 text-xs leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap">
                        {selectedSession.feedbackComment || 'Karyawan belum menyertakan ulasan tertulis.'}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium block text-right">
                        {selectedSession.isAnonymous ? 'Dikirim secara Anonim' : `Oleh: ${selectedSession.employeeName}`}
                      </span>
                    </div>
                    {selectedSession.replies && selectedSession.replies.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Balasan HOD</span>
                        {selectedSession.replies.map(reply => (
                          <div key={reply.id} className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-blue-800 block">{reply.authorName} (HOD) — {new Date(reply.timestamp).toLocaleString('id-ID')}</span>
                            <p className="text-xs text-blue-900 mt-1 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={handleCloseModal} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200">
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
