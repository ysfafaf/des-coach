/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, CoachingSession, Reply } from '../types';
import {
  MessageSquareHeart,
  Search,
  Star,
  MessageCircle,
  CornerDownRight,
  Send,
  UserCheck,
  EyeOff,
  Eye,
  Clock,
  Sparkles,
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackViewProps {
  currentUser: User;
  users: User[];
  sessions: CoachingSession[];
  onAddReply: (sessionId: string, replyContent: string) => void;
}

export default function FeedbackView({ currentUser, users, sessions, onAddReply }: FeedbackViewProps) {
  const coaches = users.filter(u => u.role === 'Supervisi' || u.role === 'HOD');

  // State for selected coach to analyze
  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
  const [replyInputSessionId, setReplyInputSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Find selected coach details
  const currentCoach = coaches.find(c => c.id === selectedCoachId);

  // Filter completed sessions with feedback comments
  const feedbackSessions = sessions.filter(s => s.isCompleted && s.feedbackComment);

  // Calculate stats for the selected coach
  const coachSessions = feedbackSessions.filter(s => s.coachId === selectedCoachId);
  const averageRating = coachSessions.length > 0
    ? (coachSessions.reduce((acc, s) => acc + Number(s.rating || 0), 0) / coachSessions.length).toFixed(1)
    : '0.0';

  // State to submit reply
  const handleReplySubmit = (e: React.FormEvent, sessionId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    onAddReply(sessionId, replyText);
    setReplyText('');
    setReplyInputSessionId(null);
    alert('Balasan Anda berhasil dikirim dan ditambahkan ke dalam log komunikasi bimbingan.');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl relative overflow-hidden shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareHeart className="w-5 h-5 text-slate-900" /> Analisis Feedback Karyawan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Halaman evaluasi komprehensif bagi Head of Department (HOD) untuk memantau rating kerja coach, membaca komentar, serta memberikan arahan balasan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: CARI COACH (COACH RATING BOARD) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pilih Coach</h4>
            <h3 className="text-sm font-bold text-slate-800">Nilai Rata-rata</h3>
          </div>

          {/* Coach Selector */}
          <div>
            <label className="block text-slate-400 text-[9px] font-bold mb-1.5 uppercase tracking-wider">Supervisor / Coach</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2.5 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
            >
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.position})</option>
              ))}
            </select>
          </div>

          {/* Average Rating Big Badge */}
          {currentCoach && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg text-center space-y-3">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Rating Rata-rata</span>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-sans flex items-center justify-center gap-2">
                {averageRating} <span className="text-slate-400 text-base font-normal">/ 5.0</span>
              </div>

              {/* Star graphics representation */}
              <div className="flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map(starNum => {
                  const roundedAvg = Math.round(Number(averageRating));
                  return (
                    <Star
                      key={starNum}
                      className={`w-4 h-4 ${starNum <= roundedAvg ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                    />
                  );
                })}
              </div>

              <span className="text-[10px] text-slate-500 block mt-1.5 font-medium">
                Total {coachSessions.length} ulasan bimbingan
              </span>
            </div>
          )}

          {/* Quality Indicator Checklist */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-slate-500" />
              <span>Sertifikasi bimbingan terverifikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span>Sesuai target standar kepuasan &gt; 4.2</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT FEEDBACKS & COMMENT BOARD */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Komentar Terbaru</h4>
              <h3 className="text-sm font-bold text-slate-800">Log Feedback & Balasan HOD</h3>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono font-semibold text-slate-600">
              Total Feedback: {coachSessions.length}
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {coachSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                Belum ada ulasan tertulis yang diinput oleh karyawan untuk coach ini.
              </div>
            ) : (
              coachSessions.map(sess => (
                <div
                  key={sess.id}
                  className="bg-slate-50 border border-slate-200 p-4.5 rounded-lg space-y-3 hover:border-slate-300 transition-all duration-150"
                >
                  {/* Reviewer Name and Rating stars */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">
                          {sess.isAnonymous ? 'Karyawan (Anonim)' : sess.employeeName}
                        </span>
                        {sess.isAnonymous ? (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" title="Anonim" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-slate-400" title="Identitas Terbuka" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Sesi: {sess.isAnonymous ? 'Topik Dirahasiakan' : sess.topic}</p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span className="text-[10px] font-bold font-mono">{sess.rating}</span>
                    </div>
                  </div>

                  {/* Feedback comment body */}
                  <div className="bg-white border border-slate-100 p-3 rounded-md">
                    <p className="text-slate-700 text-xs leading-relaxed italic">
                      "{sess.feedbackComment}"
                    </p>
                  </div>

                  {/* Existing Replies inside Session thread */}
                  {sess.replies && sess.replies.length > 0 && (
                    <div className="pl-4 space-y-2 border-l-2 border-slate-200 mt-2">
                      {sess.replies.map(reply => (
                        <div key={reply.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{reply.authorName} ({reply.authorRole})</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(reply.timestamp).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-normal">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Button Trigger / Inline Form */}
                  <div className="flex justify-end pt-1">
                    {replyInputSessionId === sess.id ? (
                      <form
                        onSubmit={(e) => handleReplySubmit(e, sess.id)}
                        className="w-full flex gap-2 items-center"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Ketik instruksi balasan, dukungan divisi, atau tanggapan HOD..."
                          className="flex-1 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                          title="Kirim Balasan"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyInputSessionId(null);
                            setReplyText('');
                          }}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer border border-slate-200"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyInputSessionId(sess.id);
                          setReplyText('');
                        }}
                        className="text-[10px] text-slate-800 hover:text-slate-900 font-bold flex items-center gap-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        Balas Komentar
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
