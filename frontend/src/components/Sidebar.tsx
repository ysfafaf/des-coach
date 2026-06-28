/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole } from '../types';
import { 
  Calendar, 
  Clock, 
  History, 
  LayoutDashboard, 
  Users, 
  MessageSquareHeart, 
  LogOut, 
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentUser, activeView, setActiveView, onLogout }: SidebarProps) {
  // Define dynamic menu items based on role
  const getMenuItems = () => {
    const items = [];

    // Dashboard available for Admin and HOD
    if (currentUser.role === 'Admin' || currentUser.role === 'HOD') {
      items.push({
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard
      });
    }

    // Users view: Admin (CRUD) or HOD (Read-Only)
    if (currentUser.role === 'Admin' || currentUser.role === 'HOD') {
      items.push({
        id: 'users',
        label: currentUser.role === 'Admin' ? 'Kelola User' : 'Daftar Karyawan',
        icon: Users
      });
    }

    // Jadwal / Kalender is available to all roles
    items.push({
      id: 'jadwal',
      label: 'Kalender Jadwal',
      icon: Calendar
    });

    // Coaching (Start sessions, rate sessions) - not for Admin
    if (currentUser.role !== 'Admin') {
      items.push({
        id: 'coaching',
        label: 'Sesi Coaching',
        icon: Clock
      });
    }

    // History is available to all roles except Admin (as Admin has only dashboard/users/jadwal)
    if (currentUser.role !== 'Admin') {
      items.push({
        id: 'histori',
        label: 'Histori Coaching',
        icon: History
      });
    }

    // Feedback (Ratings & Comments breakdown) - HOD only
    if (currentUser.role === 'HOD') {
      items.push({
        id: 'feedback',
        label: 'Analisis Feedback',
        icon: MessageSquareHeart
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'HOD':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Admin':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Supervisi':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Karyawan':
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full">
      {/* Branding Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white text-base">
            D
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-slate-900 font-bold tracking-tight text-sm">DES-Coach</span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider">PORTAL BIMBINGAN</p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <span className="px-3 text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-2">
          Menu Utama
        </span>
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-left ${
                isActive 
                  ? 'bg-slate-900 text-white font-medium' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-xs">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3 h-3 text-white/70" />}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile & Logout Card */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* User Card */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold shrink-0 text-xs">
            {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-slate-900 text-xs font-bold block truncate leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5 leading-none">
              {currentUser.position}
            </span>
            <div className="mt-1.5">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-semibold border ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 text-slate-600 rounded-lg border border-slate-200 text-xs font-medium transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
