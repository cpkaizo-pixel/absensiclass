import React, { useState, useEffect } from 'react';
import { History, Filter, Search, CheckCircle2 } from 'lucide-react';
import { AttendanceRecord, User } from '../../types';
import { api } from '../../lib/api';

export const StudentHistory: React.FC<{ user: User }> = ({ user }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getHistory({ student_id: user.id }).then((res) => {
      if (res.data) setRecords(res.data);
    });
  }, [user.id]);

  const filtered = records.filter((r) => {
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchSearch =
      r.mata_pelajaran.toLowerCase().includes(search.toLowerCase()) ||
      r.tanggal.includes(search) ||
      (r.keterangan && r.keterangan.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const total = records.length;
  const hadir = records.filter((r) => r.status === 'HADIR').length;
  const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Riwayat Presensi Saya</h1>
          <p className="text-sm text-slate-400">
            Daftar lengkap rekaman kehadiran pada setiap mata pelajaran dan sesi absensi.
          </p>
        </div>

        <div className="p-3 px-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Persentase Kehadiran:</span>
          <span className="text-lg font-black text-emerald-400">{rate}%</span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="IZIN">Izin</option>
            <option value="SAKIT">Sakit</option>
            <option value="ALFA">Alfa</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari mata pelajaran, tanggal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-y border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12">No</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Waktu Presensi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((r, idx) => (
                <tr key={r.attendance_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-white">{r.mata_pelajaran}</td>
                  <td className="py-3 px-4 text-slate-400">{r.tanggal}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{r.waktu_absen || '-'}</td>
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada riwayat absensi yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
