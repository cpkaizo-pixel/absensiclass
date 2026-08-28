import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Users,
  Clock,
  Radio,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  Schedule,
} from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';
import { OpenSessionModal } from './OpenSessionModal';

export const TeacherAttendanceLive: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit record status modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('HADIR');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const { showSuccess, showError } = useToast();

  const loadSessions = async () => {
    const [sessRes, schRes] = await Promise.all([api.getAllSessions(), api.getSchedules()]);
    if (sessRes.data) {
      setSessions(sessRes.data);
      if (sessRes.data.length > 0 && !selectedSessionId) {
        // Default to active or first session
        const active = sessRes.data.find((s) => s.status === 'OPEN');
        setSelectedSessionId(active ? active.session_id : sessRes.data[0].session_id);
      }
    }
    if (schRes.data) setSchedules(schRes.data);
  };

  const loadRecords = async (sessionId: string) => {
    if (!sessionId) return;
    const res = await api.getHistory({ session_id: sessionId });
    if (res.data) {
      setRecords(res.data);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadRecords(selectedSessionId);
      const interval = setInterval(() => loadRecords(selectedSessionId), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmittingEdit(true);
    try {
      const res = await api.updateStatus(editingRecord.attendance_id, editStatus, editKeterangan);
      if (res.success) {
        showSuccess('Status absensi berhasil diperbarui!');
        setEditingRecord(null);
        if (selectedSessionId) loadRecords(selectedSessionId);
      } else {
        showError(res.message || 'Gagal mengubah status');
      }
    } catch {
      showError('Gagal memperbarui status');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const selectedSession = sessions.find((s) => s.session_id === selectedSessionId);

  const filteredRecords = records.filter((r) => {
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchSearch =
      r.nama_siswa.toLowerCase().includes(search.toLowerCase()) ||
      r.nis.includes(search) ||
      (r.keterangan && r.keterangan.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const countHadir = records.filter((r) => r.status === 'HADIR').length;
  const countIzin = records.filter((r) => r.status === 'IZIN').length;
  const countSakit = records.filter((r) => r.status === 'SAKIT').length;
  const countAlfa = records.filter((r) => r.status === 'ALFA').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sesi Absensi & Presensi Live</h1>
          <p className="text-sm text-slate-400">
            Monitoring kehadiran siswa secara real-time dan pengelolaan status per sesi.
          </p>
        </div>

        <button
          id="btn-open-session-tab"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buka Sesi Absensi Baru</span>
        </button>
      </div>

      {/* Session Selector Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {sessions.map((sess) => {
          const isSelected = selectedSessionId === sess.session_id;
          const isOpen = sess.status === 'OPEN';
          return (
            <button
              key={sess.session_id}
              onClick={() => setSelectedSessionId(sess.session_id)}
              className={`shrink-0 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 shadow-md text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="font-bold text-xs text-white">{sess.nama_kelas}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {sess.kode_absensi}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 truncate max-w-[160px]">
                {sess.mata_pelajaran}
              </p>
              <p className="text-[10px] text-slate-500">{sess.tanggal}</p>
            </button>
          );
        })}
      </div>

      {/* Current Selected Session Card Details */}
      {selectedSession && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedSession.status === 'OPEN'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {selectedSession.status === 'OPEN' ? 'SESI AKTIF (OPEN)' : 'SESI SELESAI (CLOSED)'}
                </span>
                <span className="text-xs text-slate-400">• Tanggal: {selectedSession.tanggal}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {selectedSession.mata_pelajaran} — {selectedSession.nama_kelas}
              </h2>
              <p className="text-xs text-slate-400">
                Pengajar: <strong className="text-slate-200">{selectedSession.nama_guru}</strong> • Waktu:{' '}
                {selectedSession.waktu_mulai} - {selectedSession.waktu_selesai} WIB
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Kode Absensi
                </span>
                <span className="text-lg font-black text-amber-400 font-mono tracking-wider">
                  {selectedSession.kode_absensi}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Hadir</span>
              <div className="text-2xl font-black text-emerald-400">{countHadir}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Izin</span>
              <div className="text-2xl font-black text-amber-400">{countIzin}</div>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <span className="text-[10px] font-bold text-sky-400 uppercase">Sakit</span>
              <div className="text-2xl font-black text-sky-400">{countSakit}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-400 uppercase">Alfa</span>
              <div className="text-2xl font-black text-rose-400">{countAlfa}</div>
            </div>
          </div>

          {/* Table Header Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="HADIR">Hadir</option>
                <option value="IZIN">Izin</option>
                <option value="SAKIT">Sakit</option>
                <option value="ALFA">Alfa</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Waktu Presensi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((r, idx) => (
                  <tr key={r.attendance_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-white">{r.nama_siswa}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{r.nis}</td>
                    <td className="py-3 px-4 text-slate-400">{r.waktu_absen || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'HADIR'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : r.status === 'IZIN'
                            ? 'bg-amber-500/20 text-amber-400'
                            : r.status === 'SAKIT'
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 italic">{r.keterangan || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingRecord(r);
                          setEditStatus(r.status);
                          setEditKeterangan(r.keterangan || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Ubah Status</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Ubah Status Absensi</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 text-xs text-slate-300">
              <p className="font-bold text-white text-sm">{editingRecord.nama_siswa}</p>
              <p className="text-slate-500 font-mono">NIS: {editingRecord.nis}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Pilih Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['HADIR', 'IZIN', 'SAKIT', 'ALFA'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        editStatus === st
                          ? st === 'HADIR'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : st === 'IZIN'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : st === 'SAKIT'
                            ? 'bg-sky-600 text-white border-sky-500'
                            : 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Keterangan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  placeholder="contoh: Izin dinas sekolah / Sakit demam..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Session Creator Modal */}
      <OpenSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schedules={schedules}
        onSessionCreated={(newSession) => {
          loadSessions();
          setSelectedSessionId(newSession.session_id);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
