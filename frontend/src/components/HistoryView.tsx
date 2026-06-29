/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, CoachingSession } from '../types';
import {
  History,
  Search,
  Filter,
  MapPin,
  Video,
  Star,
  FileText,
  MessageSquare,
  X,
  CheckCircle2,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  currentUser: User;
  sessions: CoachingSession[];
}

export default function HistoryView({ currentUser, sessions }: HistoryViewProps) {
  const isHOD = currentUser.role === 'HOD';
  const isSupervisi = currentUser.role === 'Supervisi';
  const isKaryawan = currentUser.role === 'Karyawan';

  // State for HOD Tab Swapper (as shown in Figma slide 22: "Your Session" and "Other Coach's")
  const [hodTab, setHodTab] = useState<'your' | 'other'>('your');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Modal view states
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null);
  const [modalType, setModalType] = useState<'notes' | 'feedback' | null>(null);

  // Filter completed sessions
  const completedSessions = sessions.filter(s => s.isCompleted);

  // Scope sessions based on Role and HOD toggle
  const getVisibleSessions = () => {
    if (isHOD) {
      if (hodTab === 'your') {
        // HOD's own sessions
        return completedSessions.filter(s => s.coachId === currentUser.id);
      } else {
        // Other coaches' sessions
        return completedSessions.filter(s => s.coachId !== currentUser.id);
      }
    }
    if (isSupervisi) {
      // Supervisors can ONLY see their own sessions
      return completedSessions.filter(s => s.coachId === currentUser.id);
    }
    if (isKaryawan) {
      // Employees can ONLY see their own sessions
      return completedSessions.filter(s => s.employeeId === currentUser.id);
    }
    return [];
  };

  const visibleSessions = getVisibleSessions().filter(s => {
    const employeeName = s.employeeName ?? '';
    const coachName = s.coachName ?? '';
    const topic = s.topic ?? '';
    const matchesSearch = employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (session: CoachingSession, type: 'notes' | 'feedback') => {
    setSelectedSession(session);
    setModalType(type);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
    setModalType(null);
  };

  // Compile unique categories present invisible session scope
  const availableCategories = Array.from(new Set(completedSessions.map(s => s.category)));

  return (
    <div className="space-y-6">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Histori Coaching & Konseling</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isHOD
              ? 'Arsip digital bimbingan departemen. Pantau perkembangan diskusi kerja dan analisis kepuasan bimbingan karyawan.'
              : 'Daftar riwayat bimbingan yang telah diselesaikan beserta kesimpulan rencana tindak lanjut.'}
          </p>
        </div>

        {/* HOD Tabs implementation ("Your Session" vs "Other Coach's") */}
        {isHOD && (
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
            <button
              onClick={() => setHodTab('your')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${hodTab === 'your'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Sesi Anda
            </button>
            <button
              onClick={() => setHodTab('other')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${hodTab === 'other'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Coach Lainnya (Supervisi)
            </button>
          </div>
        )}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center shadow-xs">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={isKaryawan ? "Cari topik atau nama coach..." : "Cari topik atau nama karyawan..."}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg pl-10 pr-4 py-2.5 focus:border-slate-400 focus:bg-white outline-none placeholder:text-slate-400 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2.5 focus:border-slate-400 focus:bg-white outline-none cursor-pointer w-full sm:w-48"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="Semua">Semua Kategori</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* SESSIONS CARDS GRID */}
      {visibleSessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic shadow-xs">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          Tidak ada data riwayat bimbingan yang tuntas ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleSessions.map(session => (
            <div
              key={session.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-bold">
                  <span></span>
                  <span>{session.date}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1" title={session.topic}>
                    {session.topic}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{session.category}</p>
                </div>

                <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Coach: <span className="font-semibold text-slate-800">{session.coachName}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Karyawan: <span className="font-semibold text-slate-800">{session.employeeName}</span></span>
                  </div>
                  <div className="pt-1">
                    {session.mode === 'Online' ? (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[9px] font-semibold border border-slate-200">
                        <Video className="w-3 h-3 text-slate-500" /> Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded text-[9px] font-semibold border border-slate-200" title={session.roomName}>
                        <MapPin className="w-3 h-3 text-slate-500" /> Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION TOGGLES */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2.5">
                {/* Rating Display */}
                {!isSupervisi ? (
                  session.rating ? (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                      <span className="text-[11px] font-black font-mono">{session.rating}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum dinilai</span>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Selesai</span>
                )}

                {/* View Details triggers */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenModal(session, 'notes')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Catatan
                  </button>

                  {!isSupervisi && (session.feedbackComment || isHOD) && (
                    <button
                      onClick={() => handleOpenModal(session, 'feedback')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                      disabled={!session.feedbackComment}
                      style={{ opacity: session.feedbackComment ? 1 : 0.4 }}
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

      {/* ARSIP MODAL DIALOGS */}
      <AnimatePresence>
        {selectedSession && modalType && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-slate-900 text-sm font-bold flex items-center gap-2">
                  {modalType === 'notes' ? (
                    <>
                      <FileText className="w-4.5 h-4.5 text-slate-800" /> Catatan Evaluasi Coach
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4.5 h-4.5 text-slate-800" /> Ulasan Kepuasan Karyawan
                    </>
                  )}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Session Context Header inside modal */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="text-slate-500">Sesi: <span className="font-semibold text-slate-900">{selectedSession.topic}</span></p>
                  <p className="text-slate-400">Tanggal: {selectedSession.date} • Coach: {selectedSession.coachName}</p>
                </div>

                {/* MODAL TYPE 1: NOTES summary */}
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
                          {selectedSession.followUp.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
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

                {/* MODAL TYPE 2: FEEDBACK summary */}
                {modalType === 'feedback' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">Skor Rating</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map(starNum => (
                          <Star
                            key={starNum}
                            className={`w-4.5 h-4.5 ${starNum <= (selectedSession.rating || 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                              }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Komentar & Ulasan</span>
                      <p className="text-slate-800 text-xs leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap">
                        {selectedSession.feedbackComment || 'Karyawan belum menyertakan ulasan tertulis.'}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium block text-right">
                        {selectedSession.isAnonymous ? 'Sesi dikirim secara Anonim (Nama disembunyikan)' : `Oleh: ${selectedSession.employeeName}`}
                      </span>
                    </div>
                    {/* HOD Replies */}
                    {selectedSession.replies && selectedSession.replies.length > 0 && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Balasan HOD</span>
                        <div className="space-y-2">
                          {selectedSession.replies.map(reply => (
                            <div key={reply.id} className="bg-blue-50 border border-blue-100 p-3 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-blue-800 block">{reply.authorName} (HOD) - {new Date(reply.timestamp).toLocaleString()}</span>
                              <p className="text-xs text-blue-900 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
                >
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
