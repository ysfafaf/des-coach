import React, { useState, useRef } from 'react';
import { User, CoachingSession } from '../types';
import { TOP_TOPICS, MEETING_ROOMS } from '../initialData';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Video,
  MapPin,
  Clock,
  UserSquare2,
  Briefcase,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarViewProps {
  currentUser: User;
  users: User[];
  sessions: CoachingSession[];
  onAddSession: (newSession: CoachingSession) => Promise<boolean>;
}

export default function CalendarView({ currentUser, users, sessions, onAddSession }: CalendarViewProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [isOpenBooking, setIsOpenBooking] = useState(false);
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState(TOP_TOPICS[0]);
  const localDateStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(localDateStr);
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('14:30');
  const [targetUserId, setTargetUserId] = useState('');
  const [mode, setMode] = useState<'Online' | 'Offline'>('Online');
  const [meetingLink, setMeetingLink] = useState('https://teams.microsoft.com/l/meetup-join/descoach-new-session');
  const [roomName, setRoomName] = useState(MEETING_ROOMS[0]);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(p => p - 1); }
    else setCurrentMonth(p => p - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(p => p + 1); }
    else setCurrentMonth(p => p + 1);
  };

  const isEmployee = currentUser.role === 'Karyawan';
  const isCoach = currentUser.role === 'Supervisi' || currentUser.role === 'HOD';
  const isAdmin = currentUser.role === 'Admin';

  const potentialCoaches = users.filter(u => u.role === 'Supervisi' || u.role === 'HOD');
  const potentialEmployees = users.filter(u => u.role === 'Karyawan');

  const handleOpenBooking = () => {
    if (isEmployee) setTargetUserId(potentialCoaches[0]?.id || '');
    else if (isCoach) setTargetUserId(potentialEmployees[0]?.id || '');
    setTopic('');
    setIsOpenBooking(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) { alert('Topik coaching tidak boleh kosong.'); return; }
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationMinutes <= 0) { alert('Jam Selesai harus setelah Jam Mulai.'); return; }
    if (durationMinutes > 120) { alert('Batas durasi maksimal satu sesi coaching adalah 2 jam. Silakan sesuaikan jam.'); return; }

    let employeeId = '', employeeName = '', coachId = '', coachName = '';
    if (isEmployee) {
      employeeId = currentUser.id; employeeName = currentUser.name;
      coachId = targetUserId;
      coachName = users.find(u => u.id === targetUserId)?.name || 'Coach';
    } else {
      coachId = currentUser.id; coachName = currentUser.name;
      employeeId = targetUserId;
      employeeName = users.find(u => u.id === targetUserId)?.name || 'Karyawan';
    }

    const newSession: CoachingSession = {
      id: `ses-${Date.now()}`,
      employeeId, employeeName, coachId, coachName,
      topic, category,
      date: selectedDate, startTime, endTime,
      mode,
      meetingLink: mode === 'Online' ? meetingLink : undefined,
      roomName: mode === 'Offline' ? roomName : undefined,
      reminderMinutes,
      isCompleted: false,
      status: 'Scheduled',
    };

    const success = await onAddSession(newSession);
    if (success) setIsOpenBooking(false);
  };

  // Get sessions for a specific day
  const getSessionsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter(s => s.date === dateStr);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-900" /> Kalender Jadwal
          </h1>
          <p className="text-xs text-slate-500 mt-1">Lihat dan kelola jadwal sesi coaching yang telah direncanakan.</p>
        </div>
        {!isAdmin && (
          <button
            onClick={handleOpenBooking}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Buat Jadwal Baru
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-visible">
        {/* Month Navigator */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h2 className="text-sm font-bold text-slate-900">
            {monthsList[currentMonth]} {currentYear}
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {daysOfWeek.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 border-b border-r border-slate-100/80" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySessions = getSessionsForDay(day);
            const isToday = dayStr === todayStr;
            const isPast = dayStr < todayStr;
            const isHovered = hoveredDay === dayStr;
            return (
              <div
                key={day}
                className={`h-20 border-b border-r border-slate-100/80 p-1.5 relative group transition-all duration-150 cursor-default
                  ${isToday ? 'bg-slate-50 ring-1 ring-inset ring-slate-900/10' : ''}
                  ${isPast && !isToday ? 'bg-slate-50/30' : ''}
                  ${!isPast || isToday ? 'hover:bg-blue-50/40 hover:border-blue-200/60' : 'hover:bg-slate-50/60'}
                `}
                onMouseEnter={() => {
                  if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                  setHoveredDay(dayStr);
                }}
                onMouseLeave={() => {
                  tooltipTimeoutRef.current = setTimeout(() => setHoveredDay(null), 120);
                }}
              >
                <span className={`text-xs font-bold inline-flex w-6 h-6 items-center justify-center rounded-full transition-colors ${isToday
                  ? 'bg-slate-900 text-white'
                  : isPast
                    ? 'text-slate-400'
                    : 'text-slate-700 group-hover:bg-slate-900 group-hover:text-white'
                  }`}>
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5 overflow-hidden">
                  {daySessions.slice(0, 2).map(session => (
                    <div
                      key={session.id}
                      className={`text-[9px] font-semibold px-1 py-0.5 rounded truncate leading-tight ${session.status === 'Completed' || session.isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : session.status === 'Active'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-900/10 text-slate-700'
                        }`}
                    >
                      {session.startTime} {session.topic.substring(0, 12)}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-[9px] text-slate-400 font-mono pl-1">+{daySessions.length - 2} lagi</div>
                  )}
                </div>

                {/* Custom Tooltip */}
                {isHovered && daySessions.length > 0 && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-50 w-56 pointer-events-none"
                    onMouseEnter={() => {
                      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                    }}
                  >
                    <div className="bg-slate-50 rounded-xl shadow-2xl border border-slate-50/50 overflow-hidden">
                      {/* Tooltip header */}
                      <div className="px-3 py-2 bg-slate-800 border-b border-slate-700/60 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-50" />
                        <span className="text-[10px] font-bold text-slate-200 tracking-wide">
                          {day} {monthsList[currentMonth]} — {daySessions.length} Sesi
                        </span>
                      </div>
                      {/* Session list */}
                      <div className="p-2 space-y-1.5">
                        {daySessions.map(session => (
                          <div key={session.id} className="flex items-start gap-2">
                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${session.status === 'Completed' || session.isCompleted
                              ? 'bg-emerald-400'
                              : session.status === 'Active'
                                ? 'bg-amber-400'
                                : 'bg-slate-400'
                              }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-slate-900 truncate leading-tight">{session.topic}</p>
                              <p className="text-[9px] text-slate-900 mt-0.5">
                                {session.startTime}–{session.endTime} · {session.employeeName}
                              </p>
                              <span className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${session.status === 'Completed' || session.isCompleted
                                ? 'bg-emerald-900/60 text-emerald-300'
                                : session.status === 'Active'
                                  ? 'bg-amber-900/60 text-amber-300'
                                  : 'bg-slate-700 text-slate-300'
                                }`}>
                                {session.status === 'Completed' || session.isCompleted ? 'Selesai'
                                  : session.status === 'Active' ? 'Berlangsung' : 'Terjadwal'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-2.5 h-2.5 bg-slate-900 border-b border-r border-slate-700/50 rotate-45 -mt-1.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Jadwal Mendatang</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Daftar sesi yang belum dimulai, diurutkan berdasarkan tanggal.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {sessions
            .filter(s => !s.isCompleted && s.status !== 'Completed' && s.date >= localDateStr)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 8)
            .map(session => (
              <div key={session.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  {session.mode === 'Online' ? <Video className="w-4 h-4 text-slate-600" /> : <MapPin className="w-4 h-4 text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">{session.topic}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${session.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {session.employeeName} → {session.coachName} &nbsp;·&nbsp; {session.date} &nbsp;·&nbsp; {session.startTime}–{session.endTime}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">{session.mode}</span>
                </div>
              </div>
            ))}
          {sessions.filter(s => !s.isCompleted && s.status !== 'Completed' && s.date >= localDateStr).length === 0 && (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              Tidak ada jadwal mendatang. Buat jadwal baru menggunakan tombol di atas.
            </div>
          )}
        </div>
      </div>

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {isOpenBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsOpenBooking(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Buat Jadwal Sesi Coaching
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Isi detail sesi coaching yang akan dijadwalkan.</p>
                </div>
                <button onClick={() => setIsOpenBooking(false)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">

                  {/* Target User */}
                  {!isAdmin && (
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1 flex items-center gap-1">
                        <UserSquare2 className="w-3.5 h-3.5" />
                        {isEmployee ? 'Pilih Coach (Supervisi/HOD)' : 'Pilih Karyawan'}
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        required
                      >
                        {(isEmployee ? potentialCoaches : potentialEmployees).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Topic */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> Topik / Agenda Sesi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Diskusi peningkatan KPI atau kendala kerja harian"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors placeholder:text-slate-400"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Kategori Topik</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {TOP_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Tanggal Sesi</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Jam Mulai</label>
                      <input
                        type="time"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Jam Selesai</label>
                      <input
                        type="time"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Reminder */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Atur Pengingat Sesi</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    >
                      <option value={15}>15 Menit Sebelum Sesi</option>
                      <option value={30}>30 Menit Sebelum Sesi</option>
                      <option value={60}>1 Jam Sebelum Sesi</option>
                      <option value={1440}>1 Hari Sebelum Sesi</option>
                    </select>
                  </div>

                  {/* Mode */}
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-lg space-y-3">
                    <div className="flex gap-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="session-mode"
                          className="w-4 h-4"
                          checked={mode === 'Online'}
                          onChange={() => setMode('Online')}
                        />
                        <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-slate-400" /> ONLINE (Teams)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="session-mode"
                          className="w-4 h-4"
                          checked={mode === 'Offline'}
                          onChange={() => setMode('Offline')}
                        />
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> OFFLINE (Rapat Kantor)</span>
                      </label>
                    </div>

                    {mode === 'Online' ? (
                      <div>
                        <label className="block text-slate-500 text-[9px] font-bold mb-1 uppercase tracking-wider">Tautan Rapat Microsoft Teams / Zoom</label>
                        <input
                          type="url"
                          required
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:border-slate-400 font-mono"
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-500 text-[9px] font-bold mb-1 uppercase tracking-wider">Pilih Ruangan Rapat Tersedia</label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-slate-400 cursor-pointer font-semibold"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                        >
                          {MEETING_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsOpenBooking(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selesai Buat Jadwal
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
