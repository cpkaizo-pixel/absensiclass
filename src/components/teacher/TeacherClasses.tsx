import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ClassRoom, Student, Teacher } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

export const TeacherClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_kelas: '',
    wali_kelas_id: '',
  });
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [cRes, sRes, tRes] = await Promise.all([
      api.getClasses(),
      api.getStudents(),
      api.getTeachers(),
    ]);
    if (cRes.data) {
      setClasses(cRes.data);
      if (cRes.data.length > 0 && (!selectedClassId || !cRes.data.find(c => c.kelas_id === selectedClassId))) {
        setSelectedClassId(cRes.data[0].kelas_id);
      } else if (cRes.data.length === 0) {
        setSelectedClassId('');
      }
    }
    if (sRes.data) setStudents(sRes.data);
    if (tRes.data) setTeachers(tRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kelas.trim()) {
      showError('Nama kelas wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const res = await api.addClass(formData);
      if (res.success) {
        showSuccess(res.message || 'Kelas berhasil ditambahkan');
        setIsModalOpen(false);
        setFormData({ nama_kelas: '', wali_kelas_id: '' });
        fetchData();
      } else {
        showError(res.message || 'Gagal menambahkan kelas');
      }
    } catch (e) {
      showError('Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (kelasId: string, namaKelas: string) => {
    if (!confirm(`Hapus kelas "${namaKelas}"?`)) return;
    try {
      const res = await api.deleteClass(kelasId);
      if (res.success) {
        showSuccess('Kelas berhasil dihapus');
        fetchData();
      } else {
        showError('Gagal menghapus kelas');
      }
    } catch (e) {
      showError('Gagal menghapus kelas');
    }
  };

  const currentClass = classes.find((c) => c.kelas_id === selectedClassId);
  const classStudents = students.filter((s) => s.kelas_id === selectedClassId);
  const filteredStudents = classStudents.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      s.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            Manajemen Data Kelas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar kelas dan alokasi siswa per rombongan belajar.
          </p>
        </div>

        <button
          id="btn-add-class"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Class Cards Selector */}
      {loading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">Belum Ada Kelas Terdaftar</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Buat kelas pertama Anda (contoh: XII MIPA 1, X RPL, dll.) untuk mulai mendaftarkan siswa.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kelas Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const isSelected = selectedClassId === cls.kelas_id;
            const count = students.filter((s) => s.kelas_id === cls.kelas_id).length;
            return (
              <div
                key={cls.kelas_id}
                id={`card-class-${cls.kelas_id}`}
                onClick={() => setSelectedClassId(cls.kelas_id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative group ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{cls.nama_kelas}</h3>
                      <p className="text-xs text-slate-400">
                        Wali Kelas: {cls.nama_wali_kelas || 'Belum ditentukan'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-white">{count}</span>
                    <p className="text-[10px] text-slate-400">Siswa</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">ID: {cls.kelas_id}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClass(cls.kelas_id, cls.nama_kelas);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student List in Selected Class */}
      {selectedClassId && currentClass && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-white">
                Daftar Siswa Kelas {currentClass?.nama_kelas}
              </h2>
              <p className="text-xs text-slate-400">
                Total {classStudents.length} siswa terdaftar di kelas ini
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa / NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.student_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{s.student_id}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">{s.nis}</td>
                    <td className="py-3 px-4 font-semibold text-white">{s.nama}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">@{s.username}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      {classStudents.length === 0
                        ? 'Belum ada siswa di kelas ini. Tambahkan siswa melalui menu Data Siswa.'
                        : 'Tidak ada data siswa yang cocok dengan pencarian.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              Tambah Kelas Baru
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Masukkan nama rombongan belajar dan tentukan wali kelas.
            </p>

            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: XII MIPA 1, X IPS 2, XI TKJ"
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wali Kelas (Opsional)
                </label>
                <select
                  value={formData.wali_kelas_id}
                  onChange={(e) => setFormData({ ...formData, wali_kelas_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {teachers.map((t) => (
                    <option key={t.guru_id} value={t.guru_id}>
                      {t.nama} ({t.mata_pelajaran_utama || 'Guru'})
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
