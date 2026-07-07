import React, { useState } from 'react';
import { User, UserRole } from '../types';
import desnet from '../assets/desnet.png';
import {
  Calendar,
  Clock,
  History,
  LayoutDashboard,
  Users,
  MessageSquareHeart,
  LogOut,
  ChevronRight,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentUser, activeView, setActiveView, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getMenuItems = () => {
    const items = [];

    if (currentUser.role === 'Admin' || currentUser.role === 'HOD') {
      items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    }

    if (currentUser.role === 'Admin' || currentUser.role === 'HOD') {
      items.push({
        id: 'users',
        label: currentUser.role === 'Admin' ? 'Kelola User' : 'Daftar Karyawan',
        icon: Users,
      });
    }

    items.push({ id: 'jadwal', label: 'Kalender Jadwal', icon: Calendar });

    if (currentUser.role !== 'Admin') {
      items.push({ id: 'coaching', label: 'Sesi Coaching', icon: Clock });
    }

    if (currentUser.role !== 'Admin') {
      items.push({ id: 'histori', label: 'Histori Coaching', icon: History });
    }

    if (currentUser.role === 'HOD') {
      items.push({ id: 'feedback', label: 'Analisis Feedback', icon: MessageSquareHeart });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const getRoleBadgeColor = (_role: UserRole) => {
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-60'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full relative`}>

      {/* Toggle Button – sits OUTSIDE the aside clipping area via z-50 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-7 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400 rounded-full p-1.5 cursor-pointer z-50 shadow-md transition-all hover:shadow-lg"
        title={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
      >
        {isCollapsed ? <PanelLeftOpen className="w-2.5 h-2.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>

      {/* Branding */}
      <div className="p-6 border-b border-slate-100 h-[85px] flex items-center">
        <div className="flex items-center gap-3">
          {/* <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white text-base shrink-0">
            D
          </div> */}
          <div className='w-11 h-11 flex items-center justify-center'>
            <img src={desnet} alt="logo desnet" width={70} height={70} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="flex items-center gap-1">
                <span className="text-slate-900 font-bold tracking-tight text-sm">DesCoach</span>
              </div>
              <p className="text-[9px] text-slate-400 font-sans tracking-wider">PORTAL BIMBINGAN</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {!isCollapsed && (
          <span className="px-3 text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-2">
            Menu Utama
          </span>
        )}
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-left ${isActive
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!isCollapsed && <span className="text-xs whitespace-nowrap">{item.label}</span>}
              </div>
              {!isCollapsed && isActive && <ChevronRight className="w-3 h-3 text-white/70" />}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className={`bg-slate-50 border border-slate-200/60 rounded-xl ${isCollapsed ? 'p-2 flex-col' : 'p-3'} flex items-center gap-3 overflow-hidden`}>
          <div className="w-9 h-9 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold shrink-0 text-xs">
            {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          {!isCollapsed && (
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
          )}
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center ${isCollapsed ? 'p-2' : 'gap-2 px-4 py-2'} bg-slate-50 hover:bg-slate-100 hover:text-slate-900 text-slate-600 rounded-lg border border-slate-200 text-xs font-medium transition-all duration-200 cursor-pointer`}
          title="Keluar"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && 'Keluar'}
        </button>
      </div>
    </aside>
  );
}
