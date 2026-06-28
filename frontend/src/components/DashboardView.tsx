/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CoachingSession, User } from '../types';
import { TOP_TOPICS } from '../initialData';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  CalendarCheck, 
  FileSpreadsheet, 
  Eye, 
  MapPin, 
  Video, 
  Star,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  sessions: CoachingSession[];
  users: User[];
}

export default function DashboardView({ sessions, users }: DashboardViewProps) {
  const [selectedMonth, setSelectedMonth] = useState('Semua');

  const [stats, setStats] = useState<{ monthly: number[], topCategories: {category: string, total: string}[] } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setStats(data.data);
        }
      })
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  // Compute stats
  const coaches = users.filter(u => u.role === 'Supervisi' || u.role === 'HOD');
  const employees = users.filter(u => u.role === 'Karyawan');
  const completedSessions = sessions.filter(s => s.isCompleted);
  const totalSessionsCount = sessions.length;

  // Chart Data calculations
  // 1. Coaching sessions per month (from API)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyCoachingData = stats?.monthly ? stats.monthly.map((count, i) => ({
    name: monthNames[i], count
  })).slice(0, 12) : [];

  // 2. Coaching sessions per coach
  const sessionsPerCoach = coaches.map(coach => {
    const count = sessions.filter(s => s.coachId === coach.id).length;
    return { name: coach.name, count };
  });

  // 3. Top topics breakdown (from API)
  const topicCounts = stats?.topCategories ? stats.topCategories.map(cat => ({
    name: cat.category, count: parseInt(cat.total)
  })) : [];

  // CSV Exporter
  const handleExportCSV = () => {
    // Generate beautiful tabular CSV data of all completed sessions
    const headers = ['ID Sesi', 'Tanggal', 'Nama Karyawan', 'Topik Sesi', 'Kategori', 'Coach', 'Metode', 'Lokasi/Link', 'Durasi', 'Rating', 'Catatan Evaluasi'];
    
    const rows = completedSessions.map(s => {
      const roomOrLink = s.mode === 'Offline' ? s.roomName || 'Kantor' : s.meetingLink || 'Teams Link';
      const duration = '1.5 Jam'; // standard session duration in our templates
      return [
        s.id,
        s.date,
        s.employeeName,
        `"${s.topic.replace(/"/g, '""')}"`,
        s.category,
        s.coachName,
        s.mode,
        `"${roomOrLink.replace(/"/g, '""')}"`,
        duration,
        s.rating || 'Belum diisi',
        `"${(s.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
    });

    const csvContent = [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    // Create download trigger
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Bulanan_Coaching_DES_COACH_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Ringkasan Aktivitas Sesi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Portal analitik dan pemantauan program bimbingan karyawan di lingkungan unit kerja.
          </p>
        </div>

        {/* Real CSV download button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
          Ekspor Laporan Bulanan (.csv)
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Coach */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Coach Aktif</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{coaches.length}</h3>
            <p className="text-[10px] text-slate-500">Supervisi & HOD Divisi</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Total Karyawan */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Karyawan</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{employees.length}</h3>
            <p className="text-[10px] text-slate-500">Anggota aktif terdaftar</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Total Topik */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kategori Topik</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{TOP_TOPICS.length}</h3>
            <p className="text-[10px] text-slate-500">Fokus bimbingan karir</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        {/* Total Sesi Coaching */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Sesi Coaching</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{completedSessions.length}</h3>
            <p className="text-[10px] text-slate-500">Sesi bimbingan tuntas</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* GRAPHICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPH 1: Monthly Trend */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tren Bimbingan</h4>
              <h3 className="text-sm font-bold text-slate-800">Sesi Per Bulan</h3>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          
          {/* Custom SVG Bar Chart */}
          <div className="h-44 flex items-end justify-between pt-4 px-2">
            {monthlyCoachingData.map((data, index) => {
              const maxVal = 10;
              const heightPercent = (data.count / maxVal) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    {/* Hover Tooltip */}
                    <span className="absolute bottom-full mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none z-10">
                      {data.count} Sesi
                    </span>
                    <div 
                      className="w-7 bg-slate-800 rounded-xs transition-all duration-300 hover:bg-slate-950 shadow-xs"
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold font-mono text-slate-400 mt-2">{data.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 2: Coach Activity comparison */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Keaktifan Coach</h4>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Sesi</h3>
            </div>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-44 overflow-y-auto space-y-3 pr-1 pt-1">
            {sessionsPerCoach.map((coach, index) => {
              const maxSesi = Math.max(...sessionsPerCoach.map(c => c.count), 1);
              const barWidth = (coach.count / maxSesi) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate w-40">{coach.name}</span>
                    <span className="text-slate-500 font-mono font-semibold text-[11px]">{coach.count} sesi</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-800 h-full rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 3: Top Topics Category Distribution */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Minat Karyawan</h4>
              <h3 className="text-sm font-bold text-slate-800">Topik Paling Sering</h3>
            </div>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-44 flex flex-col justify-between space-y-2 pt-1">
            {topicCounts.map((topic, index) => {
              const opacities = ['bg-slate-900', 'bg-slate-700', 'bg-slate-500', 'bg-slate-400', 'bg-slate-300'];
              return (
                <div key={index} className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opacities[index % opacities.length]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 truncate font-medium">{topic.name}</span>
                      <span className="text-slate-500 font-mono font-semibold text-[10px] shrink-0 ml-1">{topic.count} Sesi</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-slate-100 pt-2 flex items-center gap-2 text-[9px] text-slate-400 font-medium">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Sesi bimbingan kompetensi teknis mendominasi kuartal ini.</span>
            </div>
          </div>
        </div>

      </div>

      {/* LIST TABLE: RECENT SESSIONS */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Log Aktivitas Terbaru</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Daftar lengkap history bimbingan yang telah dilaksanakan karyawan.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono font-semibold text-slate-600">
            Total Sesi Tuntas: {completedSessions.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3.5">Tanggal / Jam</th>
                <th className="px-5 py-3.5">Karyawan</th>
                <th className="px-5 py-3.5">Topik Sesi</th>
                <th className="px-5 py-3.5">Coach</th>
                <th className="px-5 py-3.5">Pelaksanaan</th>
                <th className="px-5 py-3.5 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {completedSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono whitespace-nowrap">
                    <span className="block text-slate-800 font-bold">{session.date}</span>
                    <span className="text-[10px] text-slate-400">{session.startTime} - {session.endTime}</span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    {session.employeeName}
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <span className="block truncate font-semibold text-slate-800" title={session.topic}>
                      {session.topic}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{session.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">
                    {session.coachName}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {session.mode === 'Online' ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Video className="w-3.5 h-3.5 text-slate-400" /> Online (Teams)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold" title={session.roomName}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Offline ({session.roomName?.split(' ')[1] || 'Room'})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {session.rating ? (
                      <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        <span className="font-bold font-mono">{session.rating}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Belum dinilai</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
