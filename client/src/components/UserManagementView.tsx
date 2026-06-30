import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  Users, Plus, Edit2, Trash2, Search, X, CheckCircle2,
  UserCheck, ShieldCheck, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserManagementViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (data: Omit<User, 'id'>) => Promise<boolean>;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

const ROLE_OPTIONS: UserRole[] = ['Karyawan', 'Supervisi', 'HOD', 'Admin'];
const BLANK_FORM = {
  name: '', email: '', phone: '', gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
  position: '', role: 'Karyawan' as UserRole, status: 'Active' as 'Active' | 'Inactive', password: '',
};

export default function UserManagementView({
  users, currentUser, onAddUser, onUpdateUser, onDeleteUser
}: UserManagementViewProps) {
  const isAdmin = currentUser.role === 'Admin';
  const isHOD = currentUser.role === 'HOD';
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<typeof BLANK_FORM>(BLANK_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase())
      || u.email.toLowerCase().includes(searchQuery.toLowerCase())
      || u.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'Semua' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleOpenAdd = () => {
    setFormData(BLANK_FORM);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name, email: user.email, phone: user.phone,
      gender: user.gender, position: user.position, role: user.role,
      status: user.status, password: '',
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password.trim()) { alert('Password tidak boleh kosong untuk user baru.'); return; }
    setSaving(true);
    const ok = await onAddUser({
      name: formData.name, email: formData.email, phone: formData.phone,
      gender: formData.gender, position: formData.position, role: formData.role,
      status: formData.status, password: formData.password,
    });
    setSaving(false);
    if (ok) setIsAddOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const updates: Partial<User> = {
      name: formData.name, email: formData.email, phone: formData.phone,
      gender: formData.gender, position: formData.position, role: formData.role,
      status: formData.status,
    };
    if (formData.password.trim()) updates.password = formData.password;
    onUpdateUser(editingUser.id, updates);
    setIsEditOpen(false);
    setEditingUser(null);
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      onDeleteUser(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const roleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-slate-900 text-white border-slate-900';
      case 'HOD': return 'bg-slate-700 text-white border-slate-700';
      case 'Supervisi': return 'bg-slate-500 text-white border-slate-500';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };



  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-900" />
            {isAdmin ? 'Manajemen Pengguna' : 'Daftar Karyawan'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin ? 'Kelola semua akun pengguna sistem DES-Coach.' : 'Daftar karyawan yang terdaftar dalam sistem.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Pengguna
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengguna', value: users.length, icon: Users },
          { label: 'Aktif', value: users.filter(u => u.status === 'Active').length, icon: UserCheck },
          { label: 'Supervisi/HOD', value: users.filter(u => u.role === 'Supervisi' || u.role === 'HOD').length, icon: ShieldCheck },
          { label: 'Karyawan', value: users.filter(u => u.role === 'Karyawan').length, icon: Users },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-500 font-medium">{stat.label}</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau jabatan..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-400 transition-all placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-700 outline-none focus:border-slate-400 cursor-pointer font-medium"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="Semua">Semua Role</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3.5">Nama / Email</th>
                <th className="px-5 py-3.5">Jabatan</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Kontak</th>
                {isAdmin && <th className="px-5 py-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 italic">Tidak ada pengguna yang sesuai filter.</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold text-[10px] shrink-0">
                        {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{user.position}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${roleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">{user.phone || '—'}</td>
                  {isAdmin && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => setConfirmDeleteId(user.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="text-slate-900 text-base font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-slate-900" /> Tambah Pengguna Baru
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Nama Lengkap</label>
                      <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Email</label>
                      <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Nomor HP</label>
                      <input type="text" maxLength={15} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Gender</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Laki-laki' | 'Perempuan' })}>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Sistem Role</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Jabatan / Posisi</label>
                      <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Status Akun</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-colors">Batal</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Tambahkan User'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {isEditOpen && editingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="text-slate-900 text-base font-bold flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-slate-700" /> Edit Detail Pengguna
                </h3>
                <button onClick={() => setIsEditOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Nama Lengkap</label>
                      <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Email</label>
                      <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Nomor HP</label>
                      <input type="text" maxLength={15} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Gender</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Laki-laki' | 'Perempuan' })}>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Sistem Role</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Jabatan / Posisi</label>
                      <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Status Akun</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-600 text-xs font-semibold mb-1">Ubah Sandi (Kosongkan bila tetap)</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-slate-400 transition-colors"
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-colors">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Perbarui Data
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM DIALOG */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            >
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="text-slate-900 font-bold text-sm mb-2">Hapus Pengguna?</h3>
              <p className="text-slate-500 text-xs mb-6">
                Tindakan ini tidak dapat dibatalkan. Semua data user akan dihapus dari sistem.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
                <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
