/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, CoachingSession } from '../types';
import { MEETING_ROOMS } from '../initialData';
import { 
  Play, 
  Square, 
  Clock, 
  MapPin, 
  Video, 
  FileText, 
  CheckSquare, 
  Star, 
  Sparkles, 
  Smile, 
  EyeOff, 
  Eye, 
  FlameKindling,
  History,
  TrendingUp,
  AlertCircle,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CoachingViewProps {
  currentUser: User;
  sessions: CoachingSession[];
  onStartSession: (id: string) => void;
  onEndSession: (id: string, notes: string, followUp: string[]) => void;
  onSubmitFeedback: (id: string, rating: number, comment: string, isAnonymous: boolean) => void;
}

export default function CoachingView({ 
  currentUser, 
  sessions, 
  onStartSession, 
  onEndSession, 
  onSubmitFeedback 
}: CoachingViewProps) {
  
  const isCoach = currentUser.role === 'Supervisi' || currentUser.role === 'HOD';
  const isEmployee = currentUser.role === 'Karyawan';

  // State for active session in progress (stopwatch timer)
  const [activeSessId, setActiveSessId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form states for Ending a Session (Coach)
  const [notes, setNotes] = useState('');
  const [selectedFollowUps, setSelectedFollowUps] = useState<string[]>([]);

  // Form states for Submitting Feedback (Karyawan)
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Filter sessions related to this user
  const mySessions = sessions.filter(s => {
    if (isCoach) return s.coachId === currentUser.id;
    if (isEmployee) return s.employeeId === currentUser.id;
    return false;
  });

  // Scheduled sessions (ready to start)
  const upcomingSessions = mySessions.filter(s => s.status === 'Scheduled');
  // Sessions currently active in progress
  const activeSessions = mySessions.filter(s => s.status === 'Active');
  // Completed sessions awaiting employee feedback
  const pendingFeedbackSessions = isEmployee 
    ? mySessions.filter(s => s.isCompleted && !s.rating) 
    : [];

  // Stop watch controller
  useEffect(() => {
    // If there is any active session in the database already, sync it
    const activeFromDb = mySessions.find(s => s.status === 'Active');
    if (activeFromDb && !activeSessId) {
      setActiveSessId(activeFromDb.id);
      setElapsedSeconds(0);
    }

    if (activeSessId) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSessId, sessions]);

  const handleStart = (sess: CoachingSession) => {
    onStartSession(sess.id);
    setActiveSessId(sess.id);
    setElapsedSeconds(0);
    setNotes('');
    setSelectedFollowUps([]);
  };

  const handleEnd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessId) return;

    if (!notes.trim()) {
      alert('Mohon tulis catatan kesimpulan evaluasi sebelum mengakhiri sesi.');
      return;
    }

    onEndSession(activeSessId, notes, selectedFollowUps);
    setActiveSessId(null);
    setNotes('');
    setSelectedFollowUps([]);
    alert('Sesi coaching berhasil diselesaikan dan dicatat ke dalam histori.');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSessionId) return;

    if (!comment.trim()) {
      alert('Mohon isi komentar ulasan feedback Anda.');
      return;
    }

    onSubmitFeedback(feedbackSessionId, rating, comment, isAnonymous);
    setFeedbackSessionId(null);
    setComment('');
    setRating(5);
    setIsAnonymous(false);
    alert('Terima kasih! Feedback Anda berhasil dikirim ke coach.');
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const toggleFollowUp = (option: string) => {
    if (selectedFollowUps.includes(option)) {
      setSelectedFollowUps(prev => prev.filter(o => o !== option));
    } else {
      setSelectedFollowUps(prev => [...prev, option]);
    }
  };

  const followUpOptions = [
    'Sesi lanjutan diperlukan dalam 2 minggu',
    'Mengikuti monitoring berkala',
    'Konseling profesional eksternal',
    'Selesai / Tuntas'
  ];

  // Resolve current active session object
  const currentActiveSess = sessions.find(s => s.id === activeSessId);

  return (
    <div className="space-y-6">

      {/* Title banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ruang Sesi Coaching</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isCoach 
              ? 'Luncurkan sesi bimbingan terjadwal, pantau timer, berikan catatan evaluasi, dan simpulkan tindak lanjut.'
              : 'Pantau sesi coaching aktif Anda dan berikan ulasan feedback bimbingan berharga setelah sesi tuntas.'}
          </p>
        </div>
      </div>

      {/* LIVE WORKSPACE IF COACH SESS IN PROGRESS */}
      {isCoach && currentActiveSess && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
        >
          {/* Header banner */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> LIVE SESSION WORKSPACE
              </span>
              <h3 className="text-sm font-bold text-slate-900">{currentActiveSess.topic}</h3>
            </div>
            
            {/* Live running clock */}
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-3 shadow-xs">
              <Clock className="w-4 h-4 text-slate-500 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-mono block">DURASI BERJALAN</span>
                <span className="text-lg font-bold font-mono text-slate-900 tracking-widest">{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Info panel */}
            <div className="lg:col-span-1 bg-slate-50 border border-slate-200/80 p-5 rounded-lg space-y-4 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Rincian Partisipan</h4>
              
              <div className="space-y-3.5 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Karyawan</span>
                  <span className="font-bold text-slate-800 text-xs block mt-0.5">{currentActiveSess.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Kategori Topik</span>
                  <span className="font-semibold block mt-0.5 text-slate-700">{currentActiveSess.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Jadwal Sesi</span>
                  <span className="font-semibold block mt-0.5 text-slate-700">{currentActiveSess.date} ({currentActiveSess.startTime} - {currentActiveSess.endTime})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Tempat</span>
                  {currentActiveSess.mode === 'Online' ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold block mt-1">
                      <Video className="w-3.5 h-3.5 text-slate-400" /> Microsoft Teams (Online)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold block mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {currentActiveSess.roomName}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Tulis ringkasan bimbingan Anda di bawah dan klik "Akhiri Sesi Coaching" jika pertemuan sudah selesai.</span>
              </div>
            </div>

            {/* Note & Checklist Form */}
            <form onSubmit={handleEnd} className="lg:col-span-2 space-y-5">
              
              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" /> Catatan Coach & Hasil Evaluasi
                </label>
                <textarea
                  required
                  placeholder="Tulis ringkasan hasil bimbingan, kelebihan karyawan, serta hambatan yang didiskusikan secara mendalam..."
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Follow up checklists */}
              <div className="space-y-2">
                <label className="text-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-slate-500" /> Rencana Tindak Lanjut (Follow-up)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {followUpOptions.map(option => {
                    const isChecked = selectedFollowUps.includes(option);
                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() => toggleFollowUp(option)}
                        className={`text-left p-3 rounded-lg border text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                          isChecked ? 'bg-white border-slate-900 text-slate-900 font-extrabold' : 'border-slate-300'
                        }`}>
                          {isChecked && '✓'}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* End button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <Square className="w-4 h-4 shrink-0 fill-white" /> Akhiri Sesi Coaching
                </button>
              </div>

            </form>

          </div>
        </motion.div>
      )}

      {/* EMPLOYEE PENDING FEEDBACK SUBMISSION SCREEN */}
      {isEmployee && pendingFeedbackSessions.length > 0 && (
         <div className="space-y-4">
           <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
             Ulasan Tertunda (Berikan Nilai Anda)
           </span>

           {pendingFeedbackSessions.map(sess => {
             const isSelected = feedbackSessionId === sess.id;

             return (
               <motion.div 
                 key={sess.id}
                 layout
                 className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs"
               >
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                   <div>
                     <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[9px] font-mono font-bold uppercase">
                       Butuh Penilaian Anda
                     </span>
                     <h3 className="text-sm font-bold text-slate-900 mt-1">{sess.topic}</h3>
                     <p className="text-xs text-slate-500">Coach: {sess.coachName} • Tanggal Sesi: {sess.date}</p>
                   </div>

                   {!isSelected && (
                     <button
                       onClick={() => {
                         setFeedbackSessionId(sess.id);
                         setRating(5);
                         setComment('');
                         setIsAnonymous(false);
                       }}
                       className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                     >
                       Beri Ulasan & Rating
                     </button>
                   )}
                 </div>

                 {/* Feedback Input Form Panel */}
                 <AnimatePresence>
                   {isSelected && (
                     <motion.form 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       onSubmit={handleFeedbackSubmit}
                       className="border-t border-slate-100 pt-4 space-y-4 overflow-hidden"
                     >
                       
                       {/* STAR RATING PICKER */}
                       <div className="space-y-1">
                         <label className="text-slate-700 text-xs font-bold block">Rating Kepuasan Sesi bimbingan</label>
                         <div className="flex items-center gap-1.5 py-1">
                           {[1, 2, 3, 4, 5].map(starNum => {
                             const isLit = hoverRating ? starNum <= hoverRating : starNum <= rating;
                             return (
                               <button
                                 type="button"
                                 key={starNum}
                                 className="p-1 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                                 onClick={() => setRating(starNum)}
                                 onMouseEnter={() => setHoverRating(starNum)}
                                 onMouseLeave={() => setHoverRating(0)}
                               >
                                 <Star className={`w-6 h-6 ${
                                   isLit 
                                     ? 'fill-amber-400 text-amber-400' 
                                     : 'text-slate-200'
                                 }`} />
                               </button>
                             );
                           })}
                           <span className="text-slate-500 text-xs font-bold font-mono ml-2">
                             {rating} / 5 Bintang
                           </span>
                         </div>
                       </div>

                       {/* Comment text block */}
                       <div className="space-y-1.5">
                         <label className="text-slate-700 text-xs font-bold block">Ulasan / Masukan Tertulis</label>
                         <textarea
                           required
                           placeholder="Tulis ulasan jujur mengenai jalannya bimbingan, kejelasan solusi, atau empati coach selama berdiskusi..."
                           rows={3}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                           value={comment}
                           onChange={(e) => setComment(e.target.value)}
                         />
                       </div>

                       {/* Anonymous checkbox */}
                       <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                         <label className="flex items-center gap-3 cursor-pointer select-none">
                           <input
                             type="checkbox"
                             className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-0 bg-white cursor-pointer"
                             checked={isAnonymous}
                             onChange={(e) => setIsAnonymous(e.target.checked)}
                           />
                           <div>
                             <span className="text-slate-700 text-xs font-bold block">Kirim Sebagai Anonim</span>
                             <span className="text-[10px] text-slate-400 block">Sembunyikan nama profil saya pada laporan ulasan coach</span>
                           </div>
                         </label>
                         {isAnonymous ? (
                           <EyeOff className="w-5 h-5 text-slate-600" />
                         ) : (
                           <Eye className="w-5 h-5 text-slate-400" />
                         )}
                       </div>

                       {/* Actions */}
                       <div className="flex justify-end gap-3 pt-2">
                         <button
                           type="button"
                           onClick={() => setFeedbackSessionId(null)}
                           className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-200"
                         >
                           Batal
                         </button>
                         <button
                           type="submit"
                           className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
                         >
                           <Smile className="w-3.5 h-3.5" /> Kirim Ulasan
                         </button>
                       </div>

                     </motion.form>
                   )}
                 </AnimatePresence>

               </motion.div>
             );
           })}
         </div>
       )}

       {/* UPCOMING SCHEDULES / CONFIRMED EVENTS */}
       <div className="space-y-4">
         <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
           Sesi Terjadwal Anda ({upcomingSessions.length})
         </span>

         {upcomingSessions.length === 0 ? (
           <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 italic shadow-xs">
             <History className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
             Tidak ada sesi coaching terjadwal yang aktif saat ini.
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {upcomingSessions.map(sess => (
               <div 
                 key={sess.id}
                 className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-xs hover:border-slate-300 transition-all duration-200"
               >
                 <div className="space-y-2">
                   <div className="flex justify-between items-start">
                     <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[9px] font-mono font-bold uppercase">
                       TERJADWAL
                     </span>
                     <span className="text-[10px] text-slate-400 font-mono font-bold">{sess.date}</span>
                   </div>

                   <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{sess.topic}</h3>
                   <p className="text-[11px] text-slate-500 block">Kategori: {sess.category}</p>

                   <div className="space-y-1 pt-1.5 text-[11px] text-slate-600">
                     <div className="flex items-center gap-1.5">
                       <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                       <span>Jam: {sess.startTime} - {sess.endTime} (WIB)</span>
                     </div>
                     {isCoach ? (
                       <div className="flex items-center gap-1.5">
                         <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                         <span>Karyawan: {sess.employeeName}</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-1.5">
                         <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                         <span>Coach: {sess.coachName}</span>
                       </div>
                     )}
                     <div>
                       {sess.mode === 'Online' ? (
                         <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold mt-1">
                           <Video className="w-3.5 h-3.5 text-slate-400" /> Online (Teams/Zoom)
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold mt-1">
                           <MapPin className="w-3.5 h-3.5 text-slate-400" /> {sess.roomName}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Controls for Coach: Mulai Sesi */}
                 {isCoach && (
                   <div className="border-t border-slate-100 pt-3.5 flex justify-end">
                     <button
                       onClick={() => handleStart(sess)}
                       className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                     >
                       <Play className="w-3.5 h-3.5 fill-white shrink-0" /> Mulai Sesi Sekarang
                     </button>
                   </div>
                 )}
               </div>
             ))}
           </div>
         )}
       </div>

    </div>
  );
}
