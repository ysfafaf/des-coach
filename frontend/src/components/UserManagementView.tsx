/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Edit2, 
  Trash2, 
  X, 
  Smartphone, 
  Mail, 
  Tag, 
  SlidersHorizontal,
  Plus,
  Save,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagementViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  onUpdateUser: (id: string, updatedFields: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagementView({ 
  users, 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}: UserManagementViewProps) {
  
  const isAdmin = currentUser.role === 'Admin';
  
  // Filtering & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Modal Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    position: '',
    role: 'Karyawan' as UserRole,
    status: 'Active' as 'Active' | 'Inactive',
    password: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: 'Laki-laki',
      position: '',
      role: 'Karyawan',
      status: 'Active',
      password: 'password123'
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      position: user.position,
      role: user.role,
      status: user.status,
      password: user.password || 'password123'
    });
    setSelectedUserId(user.id);
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.position) {
      alert('Mohon isi nama, email, dan jabatan!');
      return;
    }
    const success = await onAddUser(formData);
    if (success) {
      setIsAddOpen(false);
      resetForm();
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    onUpdateUser(selectedUserId, formData);
    setIsEditOpen(false);
    setSelectedUserId(null);
  };

  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus user "${user.name}" dari sistem?`);
    if (confirmDelete) {
      onDeleteUser(user.id);
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'Semua' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'Semua' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Manajemen Master Pengguna' : 'Daftar Karyawan & Organisasi'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin 
              ? 'Kelola otorisasi akun, pembuatan data profil karyawan, supervisor, dan penugasan role bimbingan.'
              : 'Daftar seluruh rekan karyawan dan tim supervisi di lingkungan unit kerja perusahaan.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            Tambah User Baru
          </button>
        )}
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau jabatan..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg pl-10 pr-4 py-2.5 focus:bg-white focus:border-blue-500 transition-colors placeholder:text-slate-400 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Role Select Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none hidden md:inline">Peran:</span>
          <select
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2.5 focus:bg-white focus:border-blue-500 outline-none cursor-pointer flex-1 md:flex-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="Semua">Semua Peran</option>
            <option value="HOD">HOD</option>
            <option value="Supervisi">Supervisi</option>
            <option value="Karyawan">Karyawan</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Status Select Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none hidden md:inline">Status:</span>
          <select
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2.5 focus:bg-white focus:border-blue-500 outline-none cursor-pointer flex-1 md:flex-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Inactive">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* USER LIST DIRECTORY */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3.5">Nama User</th>
                <th className="px-5 py-3.5">Email / No. HP</th>
                <th className="px-5 py-3.5">Jabatan / Posisi</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                {isAdmin && <th className="px-5 py-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-10 text-slate-400 italic">
                    Tidak ada data pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleColors: Record<UserRole, string> = {
                    HOD: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    Admin: 'bg-rose-50 text-rose-700 border-rose-200',
                    Supervisi: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Karyawan: 'bg-amber-50 text-amber-700 border-amber-200'
                  };

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name Card */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 select-none">
                            {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800">{user.name}</span>
                            <span className="text-[10px] text-slate-400">{user.gender}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium select-all">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[11px] font-mono select-all">{user.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-5 py-4 font-semibold text-slate-700 max-w-xs truncate">
                        {user.position}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleColors[user.role]}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {user.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Actions for Admin Only */}
                      {isAdmin && (
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-sm"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-colors cursor-pointer shadow-sm"
                              title="Hapus User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG MODAL: ADD USER (TAMBAH USER) */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-slate-900 text-base font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" /> Tambah User Baru
                </h3>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {/* Nomor HP */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Nomor HP</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors"
                      placeholder="08xxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Gender</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Laki-laki' | 'Perempuan' })}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  {/* Peran / Role */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Sistem Role</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    >
                      <option value="Karyawan">Karyawan</option>
                      <option value="Supervisi">Supervisi</option>
                      <option value="HOD">HOD</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  {/* Jabatan */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Jabatan / Posisi</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors"
                      placeholder="e.g. Senior Frontend"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Status Akun</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Sandi Akses (Password)</label>
                    <input
                      type="password"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/10 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Simpan User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL: EDIT USER (EDIT USER) */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-slate-900 text-base font-bold flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-teal-600" /> Edit Detail Pengguna
                </h3>
                <button 
                  onClick={() => setIsEditOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {/* Nomor HP */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Nomor HP</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Gender</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors cursor-pointer"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Laki-laki' | 'Perempuan' })}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  {/* Peran / Role */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Sistem Role</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors cursor-pointer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    >
                      <option value="Karyawan">Karyawan</option>
                      <option value="Supervisi">Supervisi</option>
                      <option value="HOD">HOD</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  {/* Jabatan */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Jabatan / Posisi</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Status Akun</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors cursor-pointer"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Ubah Sandi (Kosongkan bila tetap)</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-teal-500 transition-colors"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-600/10 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Perbarui Data
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
