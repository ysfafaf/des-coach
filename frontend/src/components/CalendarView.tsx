/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarViewProps {
  currentUser: User;
  users: User[];
  sessions: CoachingSession[];
  onAddSession: (newSession: CoachingSession, emailNotif: { recipientEmail: string; subject: string; body: string }) => void;
}

export default function CalendarView({ currentUser, users, sessions, onAddSession }: CalendarViewProps) {
  const today = new Date();

  // Calendar Navigation: uses actual current date
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // "Buat Jadwal" Modal State
  const [isOpenBooking, setIsOpenBooking] = useState(false);

  // Form Booking states
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState(TOP_TOPICS[0]);

  // local time formatting for default selectedDate
  const localDateStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(localDateStr);
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('14:30');
  const [targetUserId, setTargetUserId] = useState(''); // employee or coach ID
  const [mode, setMode] = useState<'Online' | 'Offline'>('Online');
  const [meetingLink, setMeetingLink] = useState('https://teams.microsoft.com/l/meetup-join/descoach-new-session');
  const [roomName, setRoomName] = useState(MEETING_ROOMS[0]);
  const [reminderMinutes, setReminderMinutes] = useState(30);

  const monthsList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Calculate grid numbers for selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Determine selectable users depending on who is booking
  const isEmployee = currentUser.role === 'Karyawan';
  const isCoach = currentUser.role === 'Supervisi' || currentUser.role === 'HOD';
  const isSupervisi = currentUser.role === 'Supervisi';
  const isAdmin = currentUser.role === 'Admin';

  const potentialCoaches = users.filter(u => u.role === 'Supervisi' || u.role === 'HOD');
  const potentialEmployees = users.filter(u => u.role === 'Karyawan');

  // Set default target user when opening modal
  const handleOpenBooking = () => {
    if (isEmployee) {
      setTargetUserId(potentialCoaches[0]?.id || '');
    } else if (isCoach) {
      setTargetUserId(potentialEmployees[0]?.id || '');
    }
    setTopic('');
    setIsOpenBooking(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      alert('Topik coaching tidak boleh kosong.');
      return;
    }

    // VALIDASI: Sesi coaching maksimal 2 jam!
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (durationMinutes <= 0) {
      alert('Jam Selesai harus setelah Jam Mulai.');
      return;
    }

    if (durationMinutes > 120) {
      alert('Pemberitahuan: Batas durasi maksimal satu sesi coaching adalah 2 jam (120 menit). Silakan sesuaikan jam mulai/selesai Anda.');
      return;
    }

    // Resolve involved parties
    let employeeId = '';
    let employeeName = '';
    let coachId = '';
    let coachName = '';

    if (isEmployee) {
      employeeId = currentUser.id;
      employeeName = currentUser.name;
      coachId = targetUserId;
      const matchedCoach = users.find(u => u.id === targetUserId);
      coachName = matchedCoach ? matchedCoach.name : 'Unknown Coach';
    } else {
      // Current user is the coach (Supervisi / HOD)
      coachId = currentUser.id;
      coachName = currentUser.name;
      employeeId = targetUserId;
      const matchedEmployee = users.find(u => u.id === targetUserId);
      employeeName = matchedEmployee ? matchedEmployee.name : 'Unknown Employee';
    }

    // Construct Email Notification Detail (Simulated)
    const targetCoach = users.find(u => u.id === coachId);
    const recipientEmail = targetCoach ? targetCoach.email : 'coach@desnet.id';

    let emailSubject = `[DES-Coach] Sesi Coaching Baru Terjadwal: ${employeeName}`;
    let emailBody = '';

    if (mode === 'Online') {
      emailBody = `Halo ${coachName},\n\nSesi coaching baru telah dijadwalkan oleh karyawan Anda:\n\n` +
        `• Karyawan: ${employeeName}\n` +
        `• Topik Sesi: ${topic}\n` +
        `• Kategori: ${category}\n` +
        `• Waktu: ${selectedDate} pukul ${startTime} - ${endTime}\n` +
        `• Metode: ONLINE (Microsoft Teams)\n` +
        `• Tautan Sesi: ${meetingLink}\n\n` +
        `Mohon hadir tepat waktu sesuai jadwal yang tertera. Terima kasih.\n- Tim DES-Coach`;
    } else {
      emailBody = `Halo ${coachName},\n\nSesi coaching baru telah dijadwalkan oleh karyawan Anda:\n\n` +
        `• Karyawan: ${employeeName}\n` +
        `• Topik Sesi: ${topic}\n` +
        `• Kategori: ${category}\n` +
        `• Waktu: ${selectedDate} pukul ${startTime} - ${endTime}\n` +
        `• Metode: OFFLINE (Tatap Muka di Kantor)\n` +
        `• Ruangan: ${roomName}\n\n` +
        `Mohon hadir tepat waktu di ruangan rapat yang telah dipesan. Terima kasih.\n- Tim DES-Coach`;
    }

    const newSession: CoachingSession = {
      id: `ses-${Date.now()}`,
      employeeId,
      employeeName,
      coachId,
      coachName,
      topic,
      category,
      date: selectedDate,
      startTime,
      endTime,
      mode,
      meetingLink: mode === 'Online' ? meetingLink : undefined,
      roomName: mode === 'Offline' ? roomName : undefined,
      reminderMinutes,
      isCompleted: false,
      status: 'Scheduled'
    };

    onAddSession(newSession, { recipientEmail, subject: emailSubject, body: emailBody });
    setIsOpenBooking(false);
  };

  // Compile calendar dates
  const calendarCells = [];
  // Blank padding cells for starting offset
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  // Month dates
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Helper to query sessions on a specific day
  const getSessionsForDate = (dateNum: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(dateNum).padStart(2, '0');
    const checkString = `${currentYear}-${formattedMonth}-${formattedDay}`;

    return sessions.filter(s => s.date === checkString);
  };

  return (
    <div className="space-y-6">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kalender Sesi Coaching</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lihat ketersediaan, kelola waktu, dan jadwalkan sesi bimbingan bersama rekan tim.
          </p>
        </div>

        {/* Create button, disabled for admin and supervisi */}
        {!isAdmin && !isSupervisi && (
          <button
            onClick={handleOpenBooking}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Buat Jadwal Sesi
          </button>
        )}
      </div>

      {/* CALENDAR BLOCK */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-visible shadow-xs">

        {/* Month Navigation Control */}
        <div className="p-5 bg-slate-50 border-b border-slate-200/85 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{monthsList[currentMonth]} {currentYear}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
              title="Bulan Selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center font-bold text-slate-500 text-[11px] py-3 uppercase tracking-wider select-none">
          {daysOfWeek.map((day, index) => (
            <div key={day} className={index === 0 ? 'text-red-600' : 'text-slate-500'}>
              {day}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 bg-slate-200 divide-x divide-y divide-slate-200 border-b border-slate-200">
          {calendarCells.map((dateNum, idx) => {
            const hasSess = dateNum ? getSessionsForDate(dateNum) : [];
            const isToday = dateNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

            return (
              <div
                key={idx}
                className={`group min-h-28 p-2.5 flex flex-col justify-between transition-colors relative ${dateNum ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 select-none'
                  } ${isToday ? 'bg-blue-50/40 ring-1 ring-blue-500/30' : ''}`}
              >
                {/* Custom Tooltip */}
                {hasSess.length > 0 && (
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-52 bg-slate-50 text-white p-3 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 rounded-sm" />
                    <div className="font-bold text-slate-900 mb-1 border-b border-slate-700 pb-1.5 text-center text-[11px] uppercase tracking-wider">Jadwal Sesi</div>
                    <ul className="space-y-2 text-[10px] pt-1">
                      {hasSess.map((s, i) => (
                        <li key={i} className="leading-tight">
                          <span className="font-bold text-slate-900">{s.startTime}</span> - <span className="font-medium text-white">{s.topic}</span>
                          <div className="text-slate-400 mt-0.5 flex items-center gap-1">
                            <UserSquare2 className="w-3 h-3" /> {s.coachName}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Date marker */}
                <div className="flex justify-between items-center mb-1">
                  {dateNum ? (
                    <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${isToday ? 'bg-blue-600 text-white font-extrabold' : 'text-slate-700'
                      }`}>
                      {dateNum}
                    </span>
                  ) : <span />}

                  {/* Indicators */}
                  {hasSess.length > 0 && (
                    <span className="w-1 h-1 bg-slate-900 rounded-full" />
                  )}
                </div>

                {/* Scheduled list container inside cell */}
                <div className="flex-1 flex flex-col justify-end gap-1 overflow-y-auto max-h-16 mt-1 scrollbar-none">
                  {hasSess.slice(0, 2).map((sess) => {
                    const isSessCompleted = sess.isCompleted;
                    return (
                      <div
                        key={sess.id}
                        className={`p-1 rounded text-[9px] font-medium leading-tight truncate border ${isSessCompleted
                          ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          : 'bg-slate-900 border-slate-950 text-white font-semibold'
                          }`}
                        title={`${sess.topic} (${sess.startTime})`}
                      >
                        <span className="font-bold">{sess.startTime}</span> {sess.topic}
                      </div>
                    );
                  })}
                  {hasSess.length > 2 && (
                    <span className="text-[8px] text-slate-400 text-right font-mono font-bold block pr-1">
                      +{hasSess.length - 2} Sesi lainnya
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIALOG MODAL: BUAT JADWAL (CREATE CALENDAR EVENT) */}
      <AnimatePresence>
        {isOpenBooking && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-slate-900 text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-900" /> Atur Sesi Coaching Baru
                </h3>
                <button
                  onClick={() => setIsOpenBooking(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">

                {/* User Selector depending on Role */}
                {isEmployee ? (
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Pilih Coach (HOD / Supervisi)</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                    >
                      {potentialCoaches.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.position})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Pilih Karyawan Bimbingan</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                    >
                      {potentialEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Topic */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">Topik Utama Bimbingan</label>
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
                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Kategori Topik</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {TOP_TOPICS.map(topicName => (
                        <option key={topicName} value={topicName}>{topicName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Tanggal Sesi</label>
                    <input
                      type="date"
                      required
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

                {/* Atur Pengingat */}
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

                {/* MODE Selection */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-lg space-y-3">
                  <div className="flex gap-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="session-mode"
                        className="text-slate-900 focus:ring-0 w-4 h-4"
                        checked={mode === 'Online'}
                        onChange={() => setMode('Online')}
                      />
                      <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-slate-400" /> ONLINE (Teams)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="session-mode"
                        className="text-slate-900 focus:ring-0 w-4 h-4"
                        checked={mode === 'Offline'}
                        onChange={() => setMode('Offline')}
                      />
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> OFFLINE (Rapat Kantor)</span>
                    </label>
                  </div>

                  {/* Mode input fields */}
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
                        {MEETING_ROOMS.map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
