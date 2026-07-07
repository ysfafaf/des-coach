import React, { useEffect, useState } from 'react';
import { User, CoachingSession } from '../types';
import {
  BarChart3,
  Users,
  CheckCircle2,
  TrendingUp,
  CalendarCheck,
  BookOpen,
  Video,
  MapPin,
  Star,
  Info,
  Download,
  Upload,
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  sessions: CoachingSession[];
  users: User[];
}

export default function DashboardView({ currentUser, sessions, users }: DashboardViewProps) {
  const [apiData, setApiData] = useState<{
    grafikBulanan?: { bulan: string; bulan_num: string; jumlah: number }[];
    topKategori?: { nama_kategori: string; jumlah_digunakan: number }[];
  }>({});

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('des_coach_token');
        const res = await fetch('/api/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.status === 200 && data.data) {
          setApiData({
            grafikBulanan: data.data.grafik_coaching_bulanan,
            topKategori: data.data.top_10_kategori_topik,
          });
        }
      } catch { /* fallback to local */ }
    };
    fetchDashboard();
  }, []);

  const isAdmin = currentUser.role === 'Admin';
  const completedSessions = sessions.filter(s => s.isCompleted || s.status === 'Completed');
  const totalUsers = users.length;
  const activeCoaches = users.filter(u => u.role === 'Supervisi' || u.role === 'HOD').length;
  const avgRating = completedSessions.length > 0
    ? (completedSessions.reduce((acc, s) => acc + Number(s.rating || 0), 0) / completedSessions.filter(s => s.rating).length || 0).toFixed(1)
    : '0.0';

  // Monthly sessions chart (fallback from local data)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyCounts = monthNames.map((name, i) => {
    if (apiData.grafikBulanan) {
      const apiMatch = apiData.grafikBulanan.find(d => Number(d.bulan_num) === i + 1);
      return { name, count: apiMatch ? Number(apiMatch.jumlah) : 0 };
    }
    return { name, count: completedSessions.filter(s => new Date(s.date).getMonth() === i).length };
  });

  // Coach distribution
  const sessionsPerCoach = users
    .filter(u => u.role === 'Supervisi' || u.role === 'HOD')
    .map(coach => ({
      name: coach.name,
      count: completedSessions.filter(s => s.coachId === coach.id).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // Topic distribution
  const topicCounts = apiData.topKategori
    ? apiData.topKategori.slice(0, 5).map(t => ({ name: t.nama_kategori, count: Number(t.jumlah_digunakan) }))
    : (() => {
      const counts: Record<string, number> = {};
      completedSessions.forEach(s => {
        counts[s.topic] = (counts[s.topic] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    })();

  const maxMonthly = Math.max(...monthlyCounts.map(d => d.count), 1);

  const handleExportExcel = () => {
    const headers = ['Topik', 'Kategori', 'Tanggal', 'Waktu', 'Karyawan', 'Coach', 'Mode', 'Rating', 'Status'];
    const rows = completedSessions.map(s => [
      s.topic,
      s.category,
      s.date,
      `${s.startTime} - ${s.endTime}`,
      s.employeeName,
      s.coachName,
      s.mode,
      s.rating || '-',
      'Selesai'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Sesi_Coaching_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-900" /> Dashboard HOD
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Ringkasan aktivitas coaching dan statistik kinerja bimbingan karyawan DESNET.
            </p>
          </div>

          {/* Export Excel */}

          {!isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export Laporan
              </button>
            </div>
          )}




        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sesi Selesai', value: completedSessions.length, icon: CheckCircle2, sub: 'Coaching tuntas' },
          { label: 'Total Pengguna', value: totalUsers, icon: Users, sub: 'Terdaftar di sistem' },
          { label: 'Jumlah Coach', value: activeCoaches, icon: TrendingUp, sub: 'Supervisi & HOD' },
          { label: 'Rata-rata Rating', value: avgRating, icon: Star, sub: 'Skor kepuasan' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                <kpi.icon className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 ">{kpi.value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">{kpi.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Graph 1: Monthly Bar Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tren Aktivitas</h4>
              <h3 className="text-sm font-bold text-slate-800">Sesi per Bulan</h3>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-44 flex items-end justify-center gap-0.5">
            {monthlyCounts.map((data, i) => {
              const heightPercent = (data.count / maxMonthly) * 100;
              return (
                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                  <span className="absolute bottom-6 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
                    {data.count} Sesi
                  </span>
                  <div
                    className="w-full max-w-[20px] bg-slate-600 rounded-xs transition-all duration-300 hover:bg-slate-950 shadow-xs"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  <span className="text-[9px] font-bold font-sans text-slate-400 mt-1 shrink-0">{data.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph 2: Coach Activity */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Keaktifan Coach</h4>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Sesi</h3>
            </div>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-44 overflow-y-auto space-y-3 pr-1 pt-1">
            {sessionsPerCoach.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Belum ada data coaching.
              </div>
            ) : sessionsPerCoach.map((coach, index) => {
              const maxSesi = Math.max(...sessionsPerCoach.map(c => c.count), 1);
              const barWidth = (coach.count / maxSesi) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate w-40">{coach.name}</span>
                    <span className="text-slate-500 font-sans font-semibold text-[11px]">{coach.count} sesi</span>
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

        {/* Graph 3: Top Topics */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Minat Karyawan</h4>
              <h3 className="text-sm font-bold text-slate-800">Topik Paling Sering</h3>
            </div>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-44 flex flex-col justify-between space-y-2 pt-1">
            {topicCounts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">Belum ada data topik.</div>
            ) : topicCounts.map((topic, index) => {
              const opacities = ['bg-slate-900', 'bg-slate-700', 'bg-slate-500', 'bg-slate-400', 'bg-slate-300'];
              return (
                <div key={index} className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opacities[index % opacities.length]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 truncate font-medium">{topic.name}</span>
                      <span className="text-slate-500 font-sans font-semibold text-[10px] shrink-0 ml-1">{topic.count} Sesi</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-slate-100 pt-2 flex items-center gap-2 text-[9px] text-slate-400 font-medium">

            </div>
          </div>
        </div>
      </div>

      {/* RECENT SESSIONS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Log Aktivitas Terbaru</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Daftar lengkap history bimbingan yang telah dilaksanakan karyawan.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-sans font-semibold text-slate-600">
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
              {completedSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 italic">Belum ada sesi yang selesai.</td>
                </tr>
              ) : completedSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-sans whitespace-nowrap">
                    <span className="block text-slate-800 font-bold">{session.date}</span>
                    <span className="text-[10px] text-slate-400">{session.startTime} - {session.endTime}</span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{session.employeeName}</td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <span className="block truncate font-semibold text-slate-800" title={session.topic}>{session.topic}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{session.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{session.coachName}</td>
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
                        <span className="font-bold font-sans">{session.rating}</span>
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
