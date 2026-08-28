import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  GraduationCap,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { AttendanceRecord, ClassRoom, Schedule } from '../../types';
import { api } from '../../lib/api';
import { exportToCSV } from '../../lib/utils';
import { useToast } from '../Toast';

export const TeacherReport: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { showSuccess } = useToast();

  const loadData = async () => {
    const [recRes, clsRes, schRes] = await Promise.all([
      api.getHistory(),
      api.getClasses(),
      api.getSchedules(),
    ]);

    if (recRes.data) setRecords(recRes.data);
    if (clsRes.data) setClasses(clsRes.data);
    if (schRes.data) setSchedules(schRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const subjects = Array.from(new Set(schedules.map((s) => s.mata_pelajaran)));

  const filtered = records.filter((r) => {
    const matchClass = selectedClass === 'ALL' || r.kelas_id === selectedClass;
    const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchSubject = selectedSubject === 'ALL' || r.mata_pelajaran === selectedSubject;
    const matchDate = !dateFilter || r.tanggal === dateFilter;
    const matchSearch =
      r.nama_siswa.toLowerCase().includes(search.toLowerCase()) ||
      r.nis.includes(search) ||
      (r.keterangan && r.keterangan.toLowerCase().includes(search.toLowerCase()));

    return matchClass && matchStatus && matchSubject && matchDate && matchSearch;
  });

  const handleExportCSV = () => {
    const rows = [
      ['No', 'Attendance ID', 'NIS', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Tanggal', 'Waktu Absen', 'Status', 'Keterangan'],
      ...filtered.map((r, i) => [
        i + 1,
        r.attendance_id,
        r.nis,
        r.nama_siswa,
        r.nama_kelas,
        r.mata_pelajaran,
        r.tanggal,
        r.waktu_absen,
        r.status,
        r.keterangan || '',
      ]),
    ];

    const today = new Date().toISOString().split('T')[0];
    exportToCSV(`rekap_absensi_digital_class_${today}.csv`, rows);
    showSuccess(`Berhasil mengunduh ${filtered.length} baris rekap absensi CSV`);
  };

  const hadirCount = filtered.filter((r) => r.status === 'HADIR').length;
  const izinCount = filtered.filter((r) => r.status === 'IZIN').length;
  const sakitCount = filtered.filter((r) => r.status === 'SAKIT').length;
  const alfaCount = filtered.filter((r) => r.status === 'ALFA').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Rekap Absensi Lengkap</h1>
          <p className="text-sm text-slate-400">
            Laporan riwayat kehadiran seluruh siswa dari database Google Sheets.
          </p>
        </div>

        <button
          id="btn-export-csv"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export ke CSV / Excel</span>
        </button>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Hadir:</span>
          <span className="text-lg font-bold text-emerald-400">{hadirCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Izin:</span>
          <span className="text-lg font-bold text-amber-400">{izinCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Sakit:</span>
          <span className="text-lg font-bold text-sky-400">{sakitCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Alfa:</span>
          <span className="text-lg font-bold text-rose-400">{alfaCount}</span>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Kelas
            </label>
            <select
              id="report-filter-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.kelas_id} value={c.kelas_id}>
                  {c.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Mata Pelajaran
            </label>
            <select
              id="report-filter-subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Mapel</option>
              {subjects.map((sb) => (
                <option key={sb} value={sb}>
                  {sb}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status Presensi
            </label>
            <select
              id="report-filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">Hadir</option>
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
              <option value="ALFA">Alfa</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tanggal (YYYY-MM-DD)
            </label>
            <input
              id="report-filter-date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="report-search-input"
            type="text"
            placeholder="Cari nama siswa, NIS, atau catatan keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-y border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((r, idx) => (
                <tr key={r.attendance_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-white">{r.nama_siswa}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{r.nis}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {r.nama_kelas}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-200">{r.mata_pelajaran}</td>
                  <td className="py-3 px-4 text-slate-400">{r.tanggal}</td>
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada riwayat absensi yang cocok dengan filter yang dipilih.
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
