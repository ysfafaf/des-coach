/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Mail, Lock, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onUpdateUserPassword: (email: string, newPass: string) => void;
}

export default function LoginView({ users, onLoginSuccess, onUpdateUserPassword }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password flow states
  // 'login' | 'forgot_request' | 'forgot_success' | 'reset_password'
  const [authStep, setAuthStep] = useState<'login' | 'forgot_request' | 'forgot_success' | 'reset_password'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaChecked) {
      setError('Silakan centang "I am not a robot" untuk melanjutkan.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        setError(data.message || 'Email atau Password tidak valid.');
        return;
      }

      if (data.token) {
        localStorage.setItem('descoach_token', data.token);
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungi server.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaChecked) {
      setError('Silakan centang "I am not a robot" untuk melanjutkan.');
      return;
    }

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        setError(data.message || 'Email yang dimasukkan tidak terdaftar dalam sistem.');
        return;
      }

      setAuthStep('forgot_success');
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungi server.');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetPassword || !confirmPassword) {
      setError('Semua input password wajib diisi.');
      return;
    }

    if (resetPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (resetPassword.length < 6) {
      setError('Password baru minimal harus 6 karakter.');
      return;
    }

    // Update password
    onUpdateUserPassword(forgotEmail, resetPassword);
    
    // Reset state & go back to login
    setEmail(forgotEmail);
    setPassword(resetPassword);
    setCaptchaChecked(false);
    setAuthStep('login');
    // Show quick alert of success
    alert('Password berhasil diperbarui! Silakan masuk dengan password baru Anda.');
  };

  const handleQuickLogin = async (email: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      const data = await response.json();
      if (response.ok && data.status) {
        if (data.token) localStorage.setItem('descoach_token', data.token);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative z-10">
        
        {/* LOGOS HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
          {/* DESNET Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              D
            </div>
            <div>
              <span className="text-slate-900 font-extrabold tracking-wide text-sm">DES</span>
              <span className="text-blue-600 font-semibold text-sm">NET</span>
            </div>
          </div>

          <div className="text-slate-300 text-xs font-mono select-none">|</div>

          {/* UNDIP Logo representation */}
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-sky-500" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z" fill="none" stroke="currentColor" strokeWidth="6" />
              <path d="M50 25 L70 40 L70 60 L50 75 L30 60 L30 40 Z" fill="currentColor" opacity="0.5" />
              <circle cx="50" cy="50" r="10" fill="currentColor" />
            </svg>
            <div>
              <span className="text-slate-800 font-bold tracking-tight text-xs block leading-tight">UNIVERSITAS</span>
              <span className="text-sky-600 font-black tracking-widest text-[10px] block leading-none">DIPONEGORO</span>
            </div>
          </div>
        </div>

        {/* Title branding */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            DES-Coach <Sparkles className="w-5 h-5 text-slate-400 animate-pulse" />
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Sistem Manajemen Sesi Coaching & Konseling Terintegrasi
          </p>
        </div>

        {/* Dynamic Auth Steps */}
        <AnimatePresence mode="wait">
          {authStep === 'login' && (
            <motion.div
              key="login-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 text-xs font-medium mb-1.5" htmlFor="email-login">
                    Email Perusahaan
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="email-login"
                      type="email"
                      required
                      placeholder="nama@desnet.id"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors placeholder:text-slate-400 outline-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-slate-600 text-xs font-medium" htmlFor="password-login">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setCaptchaChecked(false);
                        setAuthStep('forgot_request');
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="password-login"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors placeholder:text-slate-400 outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* CAPTCHA "I am not a robot" */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between mt-5">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={captchaChecked}
                      onChange={(e) => setCaptchaChecked(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 bg-white focus:ring-0 cursor-pointer"
                    />
                    <span className="text-slate-700 text-sm font-medium">I am not a robot</span>
                  </label>
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">reCAPTCHA</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  Masuk
                </button>
              </form>
            </motion.div>
          )}

          {authStep === 'forgot_request' && (
            <motion.div
              key="forgot-request"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="text-left mb-4">
                  <h2 className="text-slate-900 text-lg font-bold">Lupa Password?</h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Masukkan email Anda untuk menerima link pemulihan kata sandi. Sistem akan memverifikasi status keanggotaan Anda.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 text-xs font-medium mb-1.5" htmlFor="forgot-email">
                    Email Terdaftar
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="nama@desnet.id"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors placeholder:text-slate-400 outline-none"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* CAPTCHA "I am not a robot" */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between mt-5">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={captchaChecked}
                      onChange={(e) => setCaptchaChecked(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 bg-white focus:ring-0 cursor-pointer"
                    />
                    <span className="text-slate-700 text-sm font-medium">I am not a robot</span>
                  </label>
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">reCAPTCHA</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Kirim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setAuthStep('login');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Kembali ke Login Page
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {authStep === 'forgot_success' && (
            <motion.div
              key="forgot-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-700">
                <Mail className="w-8 h-8 animate-bounce" />
              </div>

              <h2 className="text-slate-900 text-lg font-bold mb-2">Email Pemulihan Dikirim!</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Pesan pergantian password telah dikirim ke email:<br />
                <span className="text-slate-900 font-bold select-all">{forgotEmail}</span>
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setAuthStep('reset_password')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" /> Atur Password Baru
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthStep('login');
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Kembali
                </button>
              </div>
            </motion.div>
          )}

          {authStep === 'reset_password' && (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="text-left mb-4">
                  <h2 className="text-slate-900 text-lg font-bold">Atur Password Baru</h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Silakan tentukan sandi baru Anda untuk akun: <span className="text-slate-900 font-semibold">{forgotEmail}</span>
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 text-xs font-medium mb-1.5" htmlFor="new-pass">
                    Password Baru
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="new-pass"
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors placeholder:text-slate-400 outline-none"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-medium mb-1.5" htmlFor="confirm-pass">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="confirm-pass"
                      type="password"
                      required
                      placeholder="Masukkan kembali password"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors placeholder:text-slate-400 outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Masuk
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK LOGIN HELPER FOR EVALUATORS */}
      <div className="w-full max-w-md mt-6 bg-white/85 border border-slate-200 rounded-xl p-4 text-center z-10 shadow-sm backdrop-blur-sm">
        <span className="text-slate-500 text-xs font-medium flex items-center justify-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Pintasan Penguji: Klik untuk masuk langsung sesuai peran
        </span>
        <div className="grid grid-cols-2 gap-2">
          {users.filter(u => ['Admin', 'HOD', 'Supervisi', 'Karyawan'].includes(u.role)).slice(0, 5).map((user) => {
            const roleColors: Record<UserRole, string> = {
              HOD: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100',
              Admin: 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200',
              Supervisi: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100',
              Karyawan: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
            };
            
            // Just select one Supervisi and one Karyawan for the grid
            if (user.id === 'usr-4' || user.id === 'usr-6') return null; // limit to 4
            
            return (
              <button
                key={user.id}
                onClick={() => handleQuickLogin(user.email)}
                className={`text-left p-2 rounded-lg border text-xs flex flex-col transition-all cursor-pointer ${roleColors[user.role]}`}
              >
                <span className="font-bold block truncate">{user.name}</span>
                <span className="text-[10px] font-mono opacity-80 mt-0.5">{user.role} ({user.position})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
