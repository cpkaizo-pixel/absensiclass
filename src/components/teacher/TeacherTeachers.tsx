import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Search,
  UserCheck,
  Shield,
  Key,
  BookOpen,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Teacher } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

export const TeacherTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password_hash: '123456',
    mata_pelajaran_utama: '',
  });
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.getTeachers();
      if (res.data) {
        setTeachers(res.data);
      }
    } catch (e) {
      showError('Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showError('Nama guru wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const res = await api.addTeacher(formData);
      if (res.success) {
        showSuccess(res.message || 'Guru berhasil ditambahkan');
        setIsModalOpen(false);
        setFormData({
          nama: '',
          username: '',
          password_hash: '123456',
          mata_pelajaran_utama: '',
        });
        loadTeachers();
      } else {
        showError(res.message || 'Gagal menambahkan guru');
      }
    } catch (e) {
      showError('Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (guruId: string, nama: string) => {
    if (!confirm(`Hapus guru "${nama}"?`)) return;
    try {
      const res = await api.deleteTeacher(guruId);
      if (res.success) {
        showSuccess('Guru berhasil dihapus');
        loadTeachers();
      } else {
        showError('Gagal menghapus guru');
      }
    } catch (e) {
      showError('Gagal menghapus guru');
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.nama.toLowerCase().includes(search.toLowerCase()) ||
      t.username.toLowerCase().includes(search.toLowerCase()) ||
      (t.mata_pelajaran_utama && t.mata_pelajaran_utama.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-400" />
            Manajemen Data Guru
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Daftarkan akun guru pengajar untuk mengelola kelas dan sesi absensi digital.
          </p>
        </div>

        <button
          id="btn-add-teacher"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Guru Baru</span>
        </button>
      </div>

      {/* Search Bar & Total */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-teacher"
            type="text"
            placeholder="Cari nama guru atau mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Total Terdaftar: <span className="text-purple-300 font-bold">{teachers.length} Guru</span>
        </div>
      </div>

      {/* Teachers List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Memuat data guru...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">Belum Ada Data Guru</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1.5 mb-5">
            Database baru dimulai dari 0. Klik tombol di bawah untuk mendaftarkan guru pengajar pertama.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Guru Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.guru_id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                      {teacher.nama.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{teacher.nama}</h4>
                      <span className="text-[11px] text-purple-400 font-mono">ID: {teacher.guru_id}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Aktif
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" /> Mapel:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {teacher.mata_pelajaran_utama || 'Umum'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-500" /> Username:
                    </span>
                    <span className="font-mono text-purple-300">{teacher.username}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={() => handleDeleteTeacher(teacher.guru_id, teacher.nama)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              Tambah Guru Pengajar
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Isi data guru untuk membuat akun login guru ke dalam sistem.
            </p>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Budi Hartono, M.Pd."
                  value={formData.nama}
                  onChange={(e) => {
                    const nama = e.target.value;
                    setFormData({
                      ...formData,
                      nama,
                      username: formData.username || nama.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mata Pelajaran Utama
                </label>
                <input
                  type="text"
                  placeholder="contoh: Matematika, Fisika, Bahasa Indonesia"
                  value={formData.mata_pelajaran_utama}
                  onChange={(e) => setFormData({ ...formData, mata_pelajaran_utama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="guru_budi"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password Default
                  </label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={formData.password_hash}
                    onChange={(e) => setFormData({ ...formData, password_hash: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
