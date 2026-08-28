import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Clock,
  Activity,
  AlertCircle,
  QrCode,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
  Radio,
} from 'lucide-react';
import {
  User,
  AttendanceRecord,
  AttendanceSession,
  Schedule,
} from '../../types';
import { api } from '../../lib/api';

interface StudentDashboardProps {
  user: User;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onNavigateTab,
}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [histRes, activeRes, schRes] = await Promise.all([
        api.getHistory({ student_id: user.id }),
        api.getActiveSession(user.kelas_id),
        api.getSchedules(user.kelas_id),
      ]);

      if (histRes.data) setRecords(histRes.data);
      if (activeRes.data) setActiveSession(activeRes.data);
      if (schRes.data) setSchedules(schRes.data);
    };
    fetchData();
  }, [user.id, user.kelas_id]);

  const total = records.length;
  const hadir = records.filter((r) => r.status === 'HADIR').length;
  const izin = records.filter((r) => r.status === 'IZIN').length;
  const sakit = records.filter((r) => r.status === 'SAKIT').length;
  const alfa = records.filter((r) => r.status === 'ALFA').length;
  const persentase = total > 0 ? Math.round((hadir / total) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Student Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Portal Siswa • {user.nama_kelas}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
            Selamat Datang, {user.nama}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            NIS: <strong className="text-blue-400 font-mono">{user.nis}</strong> • Kelas:{' '}
            <strong className="text-slate-200">{user.nama_kelas}</strong> • Status:{' '}
            <span className="text-emerald-400 font-bold">Siswa Aktif</span>
          </p>
        </div>

        <button
          id="btn-goto-student-attendance"
          onClick={() => onNavigateTab('attendance')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/25 transition-all self-start md:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Absensi Sekarang</span>
        </button>
      </div>

      {/* Active Session Notification */}
      {activeSession && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  SESI PRESENSI KELAS SEDANG DIBUKA
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {activeSession.mata_pelajaran} — {activeSession.nama_kelas}
              </h3>
              <p className="text-xs text-slate-400">
                Waktu selesai: <strong>{activeSession.waktu_selesai} WIB</strong> • Guru:{' '}
                {activeSession.nama_guru}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('attendance')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            Isi Presensi Sesi Ini →
          </button>
        </div>
      )}

      {/* Personal Attendance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Persentase Kehadiran */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
            KEHADIRAN
          </span>
          <div className="text-3xl font-black text-emerald-400">{persentase}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Rasio Presensi</p>
        </div>

        {/* Hadir */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase mb-2">
            <span>HADIR</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{hadir}</div>
          <p className="text-[11px] text-slate-500 mt-1">Kali Hadir</p>
        </div>

        {/* Izin */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase mb-2">
            <span>IZIN</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{izin}</div>
          <p className="text-[11px] text-slate-500 mt-1">Kali Izin</p>
        </div>

        {/* Sakit */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase mb-2">
            <span>SAKIT</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400">{sakit}</div>
          <p className="text-[11px] text-slate-500 mt-1">Kali Sakit</p>
        </div>

        {/* Alfa */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase mb-2">
            <span>ALFA</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{alfa}</div>
          <p className="text-[11px] text-slate-500 mt-1">Tanpa Keterangan</p>
        </div>
      </div>

      {/* 2 Column Layout: Today Schedule & Recent Personal Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Timetable */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Jadwal Mata Pelajaran
              </h2>
              <p className="text-xs text-slate-400">Kelas {user.nama_kelas}</p>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {schedules.map((sch) => (
              <div
                key={sch.schedule_id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{sch.mata_pelajaran}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">
                      {sch.hari}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">Pengajar: {sch.nama_guru}</p>
                </div>
                <div className="text-right font-mono text-slate-300">
                  {sch.jam_mulai} - {sch.jam_selesai}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance History */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Riwayat Presensi Terbaru
              </h2>
              <p className="text-xs text-slate-400">Catatan kehadiran pribadi Anda</p>
            </div>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Semua Riwayat</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {records.slice(0, 5).map((rec) => (
              <div
                key={rec.attendance_id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{rec.mata_pelajaran}</div>
                  <p className="text-slate-500 text-[11px]">
                    {rec.tanggal} • {rec.waktu_absen || '-'} WIB
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    rec.status === 'HADIR'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : rec.status === 'IZIN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : rec.status === 'SAKIT'
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {rec.status}
                </span>
              </div>
            ))}

            {records.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                Belum ada riwayat absensi tercatat.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
