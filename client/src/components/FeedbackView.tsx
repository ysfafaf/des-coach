import React, { useState } from 'react';
import { User, CoachingSession } from '../types';
import {
  MessageSquareHeart, Search, Star, MessageCircle,
  Send, UserCheck, EyeOff, Eye, Sparkles, Award, X,
} from 'lucide-react';

interface FeedbackViewProps {
  currentUser: User;
  users: User[];
  sessions: CoachingSession[];
  onAddReply: (sessionId: string, replyContent: string) => void;
}

export default function FeedbackView({ currentUser, users, sessions, onAddReply }: FeedbackViewProps) {
  const coaches = users.filter(u => u.role === 'Supervisi' || u.role === 'HOD');
  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
  const [replyInputSessionId, setReplyInputSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCoach = coaches.find(c => c.id === selectedCoachId);
  const feedbackSessions = sessions.filter(s => (s.isCompleted || s.status === 'Completed') && s.feedbackComment);
  const coachSessions = feedbackSessions.filter(s => s.coachId === selectedCoachId);
  const averageRating = coachSessions.length > 0
    ? (coachSessions.reduce((acc, s) => acc + Number(s.rating || 0), 0) / coachSessions.length).toFixed(1)
    : '0.0';

  const handleReplySubmit = (e: React.FormEvent, sessionId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(sessionId, replyText);
    setReplyText('');
    setReplyInputSessionId(null);
    alert('Balasan Anda berhasil dikirim dan ditambahkan ke dalam log komunikasi bimbingan.');
  };

  const filteredCoachSessions = coachSessions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.topic.toLowerCase().includes(q) || s.employeeName.toLowerCase().includes(q) || (s.feedbackComment || '').toLowerCase().includes(q);
  });

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

        {/* LEFT: Coach Rating Board */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Papan Peringkat</h4>
            <h3 className="text-sm font-bold text-slate-800">Daftar Coach & Rating</h3>
          </div>

          {/* Search coaches */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari coach..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Coach List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {coaches.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Tidak ada coach terdaftar.</p>
            ) : coaches.map(coach => {
              const cSessions = feedbackSessions.filter(s => s.coachId === coach.id);
              const cAvg = cSessions.length > 0
                ? (cSessions.reduce((acc, s) => acc + Number(s.rating || 0), 0) / cSessions.length).toFixed(1)
                : '—';
              const isSelected = selectedCoachId === coach.id;
              return (
                <button
                  key={coach.id}
                  onClick={() => setSelectedCoachId(coach.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{coach.name}</p>
                      <p className={`text-[9px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{coach.role}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <Star className={`w-3 h-3 ${isSelected ? 'fill-white' : 'fill-amber-400 text-amber-400'}`} />
                      {cAvg}
                    </div>
                  </div>
                  <p className={`text-[9px] mt-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{cSessions.length} ulasan</p>
                </button>
              );
            })}
          </div>

          {/* Selected Coach Stats */}
          {currentCoach && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto font-bold text-slate-700">
                  {currentCoach.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <h4 className="text-xs font-bold text-slate-900">{currentCoach.name}</h4>
                <p className="text-[9px] text-slate-400">{currentCoach.role} · {currentCoach.position || 'Coach'}</p>
              </div>

              <div className="text-center">
                <span className="text-3xl font-black text-slate-900">{averageRating}</span>
                <span className="text-xs text-slate-400 ml-1">/ 5.0</span>
              </div>

              <div className="flex justify-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block text-center">Total {coachSessions.length} ulasan bimbingan</span>

              <div className="border-t border-slate-100 pt-4 space-y-2 text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span>Sertifikasi bimbingan terverifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>Sesuai target standar kepuasan &gt; 4.2</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Feedback Comments */}
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
            {filteredCoachSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                Belum ada ulasan tertulis yang diinput oleh karyawan untuk coach ini.
              </div>
            ) : filteredCoachSessions.map(sess => (
              <div
                key={sess.id}
                className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 hover:border-slate-300 transition-all duration-150"
              >
                {/* Reviewer & Rating */}
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        {sess.isAnonymous ? 'Karyawan (Anonim)' : sess.employeeName}
                      </span>
                      {sess.isAnonymous
                        ? <span title="Anonim"><EyeOff className="w-3.5 h-3.5 text-slate-400" /></span>
                        : <span title="Identitas Terbuka"><Eye className="w-3.5 h-3.5 text-slate-400" /></span>}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Sesi: {sess.isAnonymous ? 'Topik Dirahasiakan' : sess.topic}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span className="text-[10px] font-bold font-mono">{sess.rating}</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-white border border-slate-100 p-3 rounded-md">
                  <p className="text-slate-700 text-xs leading-relaxed italic">"{sess.feedbackComment}"</p>
                </div>

                {/* Replies */}
                {sess.replies && sess.replies.length > 0 && (
                  <div className="pl-4 space-y-2 border-l-2 border-slate-200 mt-2">
                    {sess.replies.map(reply => (
                      <div key={reply.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{reply.authorName} ({reply.authorRole})</span>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(reply.timestamp).toLocaleDateString('id-ID')}</span>
                        </div>
                        <p className="text-slate-600 leading-normal">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input / Button */}
                <div className="flex justify-end pt-1">
                  {replyInputSessionId === sess.id ? (
                    <form onSubmit={(e) => handleReplySubmit(e, sess.id)} className="w-full flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder="Ketik instruksi balasan, dukungan divisi, atau tanggapan HOD..."
                        className="flex-1 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button type="submit" className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer" title="Kirim Balasan">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button type="button"
                        onClick={() => { setReplyInputSessionId(null); setReplyText(''); }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer border border-slate-200" title="Batal">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => { setReplyInputSessionId(sess.id); setReplyText(''); }}
                      className="text-[10px] text-slate-800 hover:text-slate-900 font-bold flex items-center gap-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      Balas Komentar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
