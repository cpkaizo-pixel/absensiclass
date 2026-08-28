import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Trash2, UserPlus, X, AlertCircle } from 'lucide-react';
import { Student, ClassRoom } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

export const TeacherStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas_id: '',
    username: '',
  });

  const { showSuccess, showError } = useToast();

  const loadData = async () => {
    const [sRes, cRes] = await Promise.all([api.getStudents(), api.getClasses()]);
    if (sRes.data) setStudents(sRes.data);
    if (cRes.data) {
      setClasses(cRes.data);
      if (cRes.data.length > 0 && !formData.kelas_id) {
        setFormData((prev) => ({ ...prev, kelas_id: cRes.data[0].kelas_id }));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.nama || !formData.kelas_id) {
      showError('NIS, Nama Lengkap, dan Kelas wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await api.addStudent({
        nis: formData.nis,
        nama: formData.nama,
        kelas_id: formData.kelas_id,
        username: formData.username || formData.nama.toLowerCase().replace(/\s+/g, '_'),
        status: 'aktif',
      });

      if (res.success) {
        showSuccess('Siswa berhasil ditambahkan');
        setIsAddModalOpen(false);
        setFormData({
          nis: '',
          nama: '',
          kelas_id: classes[0]?.kelas_id || '',
          username: '',
        });
        loadData();
      } else {
        showError(res.message || 'Gagal menambahkan siswa');
      }
    } catch {
      showError('Terjadi kesalahan saat menambahkan siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, nama: string) => {
    if (!confirm(`Hapus siswa "${nama}"?`)) return;
    try {
      const res = await api.deleteStudent(studentId);
      if (res.success) {
        showSuccess('Siswa berhasil dihapus');
        loadData();
      } else {
        showError('Gagal menghapus siswa');
      }
    } catch {
      showError('Gagal menghapus siswa');
    }
  };

  const filtered = students.filter((s) => {
    const matchClass = selectedClassFilter === 'ALL' || s.kelas_id === selectedClassFilter;
    const matchSearch =
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      s.username.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Kelola Data Siswa
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar seluruh siswa terdaftar yang tersimpan pada sistem absensi.
          </p>
        </div>

        <button
          id="btn-open-add-student"
          onClick={() => {
            if (classes.length === 0) {
              showError('Silakan buat Kelas terlebih dahulu di menu Data Kelas');
              return;
            }
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Warning if no classes exist */}
      {classes.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Belum ada kelas terdaftar. Buat kelas di menu <strong>Data Kelas</strong> terlebih dahulu sebelum mendaftarkan siswa.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            id="select-filter-class"
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kelas ({students.length})</option>
            {classes.map((c) => (
              <option key={c.kelas_id} value={c.kelas_id}>
                {c.nama_kelas}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-student"
            type="text"
            placeholder="Cari nama, NIS, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-y border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12">No</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s, idx) => (
                <tr key={s.student_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{s.student_id}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{s.nis}</td>
                  <td className="py-3 px-4 font-semibold text-white">{s.nama}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {s.nama_kelas || s.kelas_id}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">@{s.username}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteStudent(s.student_id, s.nama)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Hapus Siswa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                      <Users className="w-5 h-5" />
                    </div>
                    {students.length === 0
                      ? 'Belum ada siswa terdaftar. Klik tombol Tambah Siswa Baru untuk mulai menginput data.'
                      : 'Tidak ada siswa yang cocok dengan filter pencarian.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Tambah Siswa Baru
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NIS (Nomor Induk Siswa) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: 12370"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Zahra Amalia"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nama: e.target.value,
                      username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas *</label>
                <select
                  required
                  value={formData.kelas_id}
                  onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {classes.map((c) => (
                    <option key={c.kelas_id} value={c.kelas_id}>
                      {c.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username Login Siswa
                </label>
                <input
                  type="text"
                  placeholder="contoh: zahra_amalia"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
