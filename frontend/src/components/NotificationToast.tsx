/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EmailNotification } from '../types';
import { Mail, Bell, X, CheckCheck, Trash2, MailOpen, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastProps {
  notifications: EmailNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export default function NotificationToast({ notifications, onMarkAllRead, onClearAll }: NotificationToastProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeNotifId, setActiveNotifId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-lg"
        title="Simulasi Email Notifikasi"
      >
        <Mail className="w-4 h-4 shrink-0 text-blue-400" />
        <span className="text-xs font-bold text-slate-200 hidden sm:inline">Simulasi Email ({unreadCount})</span>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black font-semibold text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* DROPDOWN NOTIFICATION DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click dismisser */}
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />

            {/* Content Drawer Card */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute right-0 mt-2.5 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
            >
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Log Notifikasi Email (Simulasi)</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action bar */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-850 flex items-center justify-between text-[10px]">
                  <button 
                    onClick={onMarkAllRead}
                    className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Tandai Semua Terbaca
                  </button>
                  <button 
                    onClick={onClearAll}
                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bersihkan Log
                  </button>
                </div>
              )}

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-850">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 italic text-xs space-y-1">
                    <MailOpen className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                    <p>Log email kosong.</p>
                    <p className="text-[10px] text-slate-600">Simulasi email akan terekam saat Anda membuat sesi coaching baru di halaman kalender.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isExpanded = activeNotifId === notif.id;

                    return (
                      <div 
                        key={notif.id}
                        className={`p-3 text-xs transition-colors cursor-pointer ${
                          notif.read ? 'bg-slate-900 hover:bg-slate-850/50' : 'bg-blue-600/5 hover:bg-blue-600/10'
                        }`}
                        onClick={() => {
                          setActiveNotifId(isExpanded ? null : notif.id);
                          notif.read = true; // side-effect marking read instantly
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${notif.read ? 'bg-slate-800' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span className="truncate max-w-[150px]">{notif.recipientEmail}</span>
                              <span className="font-mono">{new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <h4 className="font-bold text-slate-200 text-xs truncate leading-snug">{notif.subject}</h4>
                            
                            {/* Expandable message body */}
                            {isExpanded ? (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-slate-400 text-[11px] leading-relaxed mt-2 p-2 bg-slate-950 rounded-lg whitespace-pre-wrap font-sans select-all border border-slate-850"
                              >
                                {notif.body}
                              </motion.p>
                            ) : (
                              <p className="text-[10px] text-slate-500 truncate mt-1">Klik untuk membaca rincian email...</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[9px] text-slate-500 text-center">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>Simulasi email didesain sesuai spesifikasi alur notifikasi.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
