import React, { useState } from 'react';
import { Mail, Lock, KeyRound, AlertCircle, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // atau 'motion/react' sesuai installanmu
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';



export default function AuthPage() {
  // Pengatur langkah: 'login' | 'forgot' | 'forgot_success' | 'reset'
  const [step, setStep] = useState('login');
  
  // State Input Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenReset, setTokenReset] = useState(''); // Untuk token dari email
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State Status & Error
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. FUNGSI HANDLE LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('auth/login', { email, password });
      
      // Simpan token Bearer ke localStorage
      localStorage.setItem('access_token', response.data.access_token);
      alert('Login Berhasil! Selamat datang ' + response.data.user?.name);
      
      // Di sini kamu bisa alihkan halaman ke Dashboard via react-router-dom
    } catch (err) {
  // JIKA TIDAK ADA RESPON DARI SERVER (SERVER MATI / CORS)
        if (!err.response) {
            setError('Koneksi Gagal! Pastikan server Backend CodeIgniter sudah dinyalakan.');
        } else {
            // Jika server merespon tapi memang datanya salah
            setError(err.response?.data?.messages?.error || err.response?.data?.message || 'Terjadi kesalahan.');
        }
    }
  };

  // 2. FUNGSI HANDLE FORGET PASSWORD (Minta Link/Token)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('auth/forget-password', { email });
      setMessage('Instruksi reset password telah dikirim ke email Anda.');
      setStep('forgot_success');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses permintaan.');
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNGSI HANDLE RESET PASSWORD (Input Password Baru)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/reset-password', {
        token: tokenReset,
        password_baru: newPassword
      });
      alert('Password berhasil diperbarui! Silakan login kembali.');
      setStep('login');
      // Reset form
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
        const pesanAsli = err.response?.data?.messages?.error || err.response?.data?.message || 'Terjadi kesalahan pada server.';
        setError(pesanAsli);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 relative overflow-hidden">
        
        {/* Dekorasi Estetik */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl"></div>

        <AnimatePresence mode="wait">
          
          {/* ================= VIEW: LOGIN ================= */}
          {step === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-3 bg-indigo-500/10 rounded-xl text-indigo-400 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white">Selamat Datang di Des-Coach</h2>
                <p className="text-sm text-slate-400 mt-1">Silakan masuk ke akun Anda</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@desnet.id"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-400 uppercase">Password</label>
                    <button type="button" onClick={() => { setError(''); setStep('forgot'); }} className="text-xs text-indigo-400 hover:underline">Lupa Password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-colors text-sm mt-2 disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Masuk ke Aplikasi'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ================= VIEW: FORGET PASSWORD ================= */}
          {step === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button onClick={() => { setError(''); setStep('login'); }} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Lupa Password?</h2>
                <p className="text-sm text-slate-400 mt-1">Masukkan email terdaftar Anda. Kami akan mengirimkan token verifikasi untuk mereset password.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Email Anda</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@desnet.id"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Mengirim...' : 'Kirim Token Reset'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ================= VIEW: FORGOT SUCCESS LINKER ================= */}
          {step === 'forgot_success' && (
            <motion.div
              key="forgot_success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <div className="inline-flex p-3 bg-emerald-500/10 rounded-xl text-emerald-400 mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Token Berhasil Dikirim!</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">{message}</p>
              
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 text-left">
                <p className="text-xs text-slate-400 mb-2">Simulasi: Paste token yang Anda terima di email untuk lanjut:</p>
                <input 
                  type="text" placeholder="Masukkan Token Reset" value={tokenReset} onChange={(e) => setTokenReset(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg py-1.5 px-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                onClick={() => { if(tokenReset) setStep('reset'); else alert('Isi token dulu!'); }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Lanjutkan ke Reset Password
              </button>
            </motion.div>
          )}

          {/* ================= VIEW: RESET PASSWORD ================= */}
          {step === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <div className="inline-flex p-3 bg-amber-500/10 rounded-xl text-amber-400 mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Buat Password Baru</h2>
                <p className="text-sm text-slate-400 mt-1">Masukkan password baru Anda untuk mengamankan akun.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}