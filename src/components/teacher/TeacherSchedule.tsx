import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  GraduationCap,
  UserCheck,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Schedule, ClassRoom, Teacher } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

export const TeacherSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    kelas_id: '',
    guru_id: '',
    mata_pelajaran: '',
    hari: 'Senin' as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    jam_mulai: '07:30',
    jam_selesai: '09:00',
  });

  const { showSuccess, showError } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [schRes, clsRes, tchRes] = await Promise.all([
      api.getSchedules(),
      api.getClasses(),
      api.getTeachers(),
    ]);
    if (schRes.data) setSchedules(schRes.data);
    if (clsRes.data) {
      setClasses(clsRes.data);
      if (clsRes.data.length > 0 && !formData.kelas_id) {
        setFormData((prev) => ({ ...prev, kelas_id: clsRes.data[0].kelas_id }));
      }
    }
    if (tchRes.data) {
      setTeachers(tchRes.data);
      if (tchRes.data.length > 0 && !formData.guru_id) {
        setFormData((prev) => ({ ...prev, guru_id: tchRes.data[0].guru_id }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelas_id || !formData.guru_id || !formData.mata_pelajaran.trim()) {
      showError('Kelas, Guru, dan Mata Pelajaran wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const res = await api.addSchedule(formData);
      if (res.success) {
        showSuccess('Jadwal pelajaran berhasil ditambahkan');
        setIsModalOpen(false);
        setFormData({
          kelas_id: classes[0]?.kelas_id || '',
          guru_id: teachers[0]?.guru_id || '',
          mata_pelajaran: '',
          hari: 'Senin',
          jam_mulai: '07:30',
          jam_selesai: '09:00',
        });
        fetchData();
      } else {
        showError(res.message || 'Gagal menambahkan jadwal');
      }
    } catch {
      showError('Terjadi kesalahan sistem saat menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, mapel: string) => {
    if (!confirm(`Hapus jadwal "${mapel}"?`)) return;
    try {
      const res = await api.deleteSchedule(scheduleId);
      if (res.success) {
        showSuccess('Jadwal berhasil dihapus');
        fetchData();
      } else {
        showError('Gagal menghapus jadwal');
      }
    } catch {
      showError('Gagal menghapus jadwal');
    }
  };

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const filtered = schedules.filter((s) => selectedDay === 'ALL' || s.hari === selectedDay);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Jadwal Pelajaran
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Jadwal mengajar dan mata pelajaran mingguan untuk seluruh rombongan belajar.
          </p>
        </div>

        <button
          id="btn-add-schedule"
          onClick={() => {
            if (classes.length === 0) {
              showError('Silakan buat Kelas terlebih dahulu');
              return;
            }
            if (teachers.length === 0) {
              showError('Silakan daftarkan Guru terlebih dahulu');
              return;
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal Baru</span>
        </button>
      </div>

      {/* Warnings if classes or teachers are empty */}
      {(classes.length === 0 || teachers.length === 0) && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Untuk menambahkan jadwal pelajaran, pastikan Anda telah membuat minimal 1 <strong>Kelas</strong> dan 1 <strong>Guru</strong>.
          </span>
        </div>
      )}

      {/* Day Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => setSelectedDay('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedDay === 'ALL'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Semua Hari ({schedules.length})
        </button>
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedDay === day
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedules Grid */}
      {loading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">Belum Ada Jadwal Pelajaran</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Tambahkan jadwal mata pelajaran untuk menghubungkan kelas, guru pengajar, dan jam absensi.
          </p>
          <button
            onClick={() => {
              if (classes.length === 0 || teachers.length === 0) {
                showError('Buat Kelas dan Guru terlebih dahulu');
                return;
              }
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jadwal Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sch) => (
            <div
              key={sch.schedule_id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-[11px] border border-indigo-500/30">
                    {sch.hari}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {sch.jam_mulai} - {sch.jam_selesai} WIB
                  </span>
                </div>

                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  {sch.mata_pelajaran}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Kelas: <strong className="text-slate-200">{sch.nama_kelas}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Guru: <strong className="text-slate-200">{sch.nama_guru}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>ID: {sch.schedule_id}</span>
                <button
                  onClick={() => handleDeleteSchedule(sch.schedule_id, sch.mata_pelajaran)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                  title="Hapus Jadwal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Tambah Jadwal Pelajaran
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mata Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Matematika Wajib, Fisika, Biologi"
                  value={formData.mata_pelajaran}
                  onChange={(e) => setFormData({ ...formData, mata_pelajaran: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas *</label>
                  <select
                    required
                    value={formData.kelas_id}
                    onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.kelas_id} value={c.kelas_id}>
                        {c.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Guru Pengajar *</label>
                  <select
                    required
                    value={formData.guru_id}
                    onChange={(e) => setFormData({ ...formData, guru_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {teachers.map((t) => (
                      <option key={t.guru_id} value={t.guru_id}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hari *</label>
                <select
                  value={formData.hari}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hari: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={formData.jam_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={formData.jam_selesai}
                    onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
