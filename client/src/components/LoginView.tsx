import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import {
  Mail,
  Lock,
  AlertCircle,
  KeyRound,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User, token?: string) => void;
  onUpdateUserPassword: (email: string, newPassword: string) => Promise<boolean>;
}

type AuthStep = 'login' | 'forgot' | 'forgot_success' | 'reset_password';

export default function LoginView({ users, onLoginSuccess, onUpdateUserPassword }: LoginViewProps) {
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setAuthStep('reset_password');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.status === 200 && data.user) {
        // Map backend user to frontend User type
        const roleMap: Record<string, UserRole> = {
          hod: 'HOD',
          admin: 'Admin',
          supervisi: 'Supervisi',
          karyawan: 'Karyawan',
        };
        const mappedUser: User = {
          id: String(data.user.id),
          name: data.user.name,
          email: email,
          phone: '',
          gender: 'Laki-laki',
          position: data.user.role,
          role: roleMap[String(data.user.role).toLowerCase()] || 'Karyawan',
          status: 'Active',
        };
        onLoginSuccess(mappedUser, data.access_token);
        return;
      }
      setError(data.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } catch {
      // Fallback: local login with INITIAL_USERS
      const matchedUser = users.find(
        u => u.email === email && (u.password === password || password === 'password123')
      );
      if (matchedUser) {
        onLoginSuccess(matchedUser);
        return;
      }
      setError('Email atau password tidak valid. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };



  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.status === 200) {
        setAuthStep('forgot_success');
        setLoading(false);
        return;
      }
      setError(data.message || 'Email tidak ditemukan di sistem kami.');
    } catch {
      const found = users.find(u => u.email === forgotEmail);
      if (!found) {
        setError('Email tidak ditemukan di sistem kami.');
      } else {
        setAuthStep('forgot_success');
      }
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (resetPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password_baru: resetPassword }),
      });
      const data = await res.json();
      if (data.status === 200) {
        setAuthStep('login');
        setResetPassword('');
        setConfirmPassword('');
        setResetToken('');
        setError('');
        alert('Password berhasil direset! Silakan login menggunakan password baru Anda.');
      } else {
        setError(data.message || 'Gagal mereset password.');
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-3xl" />
      </div>

      {/* Logo Header */}
      <div className="flex flex-col items-center mb-8 z-10">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl mb-4">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">DES-Coach</h1>
        <p className="text-slate-500 text-xs font-mono tracking-widest uppercase mt-1">Portal Bimbingan DESNET</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl z-10">
        <AnimatePresence mode="wait">

          {/* ─── LOGIN ─── */}
          {authStep === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <h2 className="text-slate-900 text-xl font-bold">Masuk ke Akun</h2>
                <p className="text-slate-500 text-xs mt-1">Gunakan kredensial yang telah diberikan oleh Admin sistem.</p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-xs font-medium mb-1.5" htmlFor="login-email">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="login-email"
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
                    <label className="text-slate-600 text-xs font-medium" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setError(''); setAuthStep('forgot'); }}
                      className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Lupa password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="login-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors placeholder:text-slate-400 outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {loading ? 'Memproses...' : 'Masuk ke Portal'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ─── FORGOT PASSWORD ─── */}
          {authStep === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <h2 className="text-slate-900 text-xl font-bold">Lupa Password</h2>
                <p className="text-slate-500 text-xs mt-1">Masukkan email terdaftar Anda. Kami akan mengirimkan link reset password.</p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-xs font-medium mb-1.5" htmlFor="forgot-email">
                    Alamat Email
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

                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {loading ? 'Mengirim...' : 'Kirim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setError(''); setAuthStep('login'); }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Kembali ke Login Page
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ─── FORGOT SUCCESS ─── */}
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

                {/* <button
                  type="button"
                  onClick={() => setAuthStep('reset_password')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" /> Atur Password Baru
                </button> */}
                <button
                  type="button"
                  onClick={() => { setError(''); setAuthStep('login'); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Kembali
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── RESET PASSWORD ─── */}
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
                  disabled={loading}
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {loading ? 'Menyimpan...' : 'Masuk'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
}
