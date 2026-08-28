import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  QrCode,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Activity,
  ArrowUpRight,
  Radio,
  PlusCircle,
  CheckCircle2,
  RefreshCw,
  GraduationCap,
  Briefcase,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  User,
  AttendanceStatistics,
  AttendanceSession,
  AttendanceRecord,
  AIAnalysisResponse,
  Schedule,
} from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';
import { OpenSessionModal } from './OpenSessionModal';

interface TeacherDashboardProps {
  user: User;
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onNavigateTab }) => {
  const [stats, setStats] = useState<AttendanceStatistics | null>(null);
  const [activeSession, setActiveSession] = useState<(AttendanceSession & { qr_code_image?: string }) | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [aiInsight, setAiInsight] = useState<AIAnalysisResponse | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachersCount, setTeachersCount] = useState<number>(0);
  const [classesCount, setClassesCount] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { showSuccess, showError } = useToast();

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, activeRes, historyRes, schRes, clsRes, tchRes, aiRes] = await Promise.all([
        api.getStatistics(),
        api.getActiveSession(),
        api.getHistory(),
        api.getSchedules(),
        api.getClasses(),
        api.getTeachers(),
        api.getAIAnalysis(),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (activeRes.data) setActiveSession(activeRes.data);
      else setActiveSession(null);
      if (historyRes.data) setRecentRecords(historyRes.data.slice(0, 8));
      if (schRes.data) setSchedules(schRes.data);
      if (clsRes.data) setClassesCount(clsRes.data.length);
      if (tchRes.data) setTeachersCount(tchRes.data.length);
      if (aiRes.data) setAiInsight(aiRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshAI = async () => {
    setLoadingAI(true);
    try {
      const res = await api.getAIAnalysis();
      if (res.data) {
        setAiInsight(res.data);
        showSuccess('Analisis AI berhasil diperbarui');
      }
    } catch {
      showError('Gagal memperbarui analisis AI');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSessionCreated = (session: AttendanceSession & { qr_code_image: string }) => {
    setActiveSession(session);
    loadData();
  };

  const statusPieData = stats
    ? [
        { name: 'Hadir', value: stats.hadir, color: '#10b981' },
        { name: 'Izin', value: stats.izin, color: '#f59e0b' },
        { name: 'Sakit', value: stats.sakit, color: '#0ea5e9' },
        { name: 'Alfa', value: stats.alfa, color: '#f43f5e' },
      ].filter((d) => d.value > 0)
    : [];

  const classBarData =
    stats?.by_class?.map((c) => ({
      name: c.nama_kelas,
      Hadir: c.hadir,
      Izin: c.izin,
      Sakit: c.sakit,
      Alfa: c.alfa,
      Persentase: c.persentase,
    })) || [];

  const totalSiswa = stats?.total_siswa || 0;
  const isZeroState = totalSiswa === 0 && classesCount === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>
              {user.role === 'ADMIN' ? 'Portal Administrator Utama' : 'Dashboard Guru Pengajar'} • {user.nama}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
            Sistem Absensi Digital Kelas
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Kelola data sekolah, buka sesi absensi mandiri siswa via QR Code & kode 6 digit, dan pantau analitik kehadiran secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-refresh-dashboard"
            onClick={loadData}
            title="Segarkan data"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            id="btn-open-session-hero"
            onClick={() => {
              if (schedules.length === 0) {
                showError('Buat jadwal pelajaran terlebih dahulu sebelum membuka sesi absensi');
                onNavigateTab('schedule');
                return;
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>{activeSession ? 'Lihat Sesi Aktif' : 'BUKA ABSENSI'}</span>
          </button>
        </div>
      </div>

      {/* Zero State Guide / Setup Checklist */}
      {isZeroState && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-purple-800/40 shadow-xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Panduan Memulai Sistem (Data Dari 0)</h3>
              <p className="text-xs text-slate-400">Ikuti 4 langkah mudah berikut untuk mulai menjalankan absensi digital:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div
              onClick={() => onNavigateTab('classes')}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center">1</span>
                <GraduationCap className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300">1. Buat Data Kelas</h4>
              <p className="text-xs text-slate-400 mt-1">Tambahkan rombongan belajar (contoh: XII MIPA 1, X RPL).</p>
            </div>

            <div
              onClick={() => onNavigateTab('teachers')}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 text-xs font-bold flex items-center justify-center">2</span>
                <Briefcase className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300">2. Daftarkan Guru</h4>
              <p className="text-xs text-slate-400 mt-1">Buat akun login untuk guru pengajar mata pelajaran.</p>
            </div>

            <div
              onClick={() => onNavigateTab('students')}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">3. Daftarkan Siswa</h4>
              <p className="text-xs text-slate-400 mt-1">Input NIS dan nama siswa yang berada di kelas.</p>
            </div>

            <div
              onClick={() => onNavigateTab('schedule')}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center">4</span>
                <Calendar className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300">4. Buat Jadwal</h4>
              <p className="text-xs text-slate-400 mt-1">Hubungkan kelas, guru, dan mapel untuk buka absensi.</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Notification Card if any */}
      {activeSession && (
        <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  SESI ABSENSI AKTIF
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {activeSession.mata_pelajaran} — {activeSession.nama_kelas}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kode 6-Digit: <strong className="text-amber-400 font-mono text-sm tracking-wider">{activeSession.kode_absensi}</strong> • Berakhir {activeSession.waktu_selesai} WIB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-view-active-session"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
            >
              Buka Layar QR / Kode
            </button>
          </div>
        </div>
      )}

      {/* 5 Statistik Hari Ini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Siswa */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>TOTAL SISWA</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats?.total_siswa || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{classesCount} Kelas Terdaftar</p>
        </div>

        {/* Hadir */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>HADIR</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {stats?.hadir || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tercatat Hadir</p>
        </div>

        {/* Izin */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-900/40 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>IZIN</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {stats?.izin || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Surat Izin</p>
        </div>

        {/* Sakit */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-sky-900/40 shadow-sm">
          <div className="flex items-center justify-between text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>SAKIT</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400">
            {stats?.sakit || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Surat Keterangan</p>
        </div>

        {/* Alfa */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-900/40 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>ALFA</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">
            {stats?.alfa || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tanpa Keterangan</p>
        </div>
      </div>

      {/* AI INSIGHT SUMMARY CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
                AI INSIGHT RINGKASAN
              </h2>
              <p className="text-xs text-slate-400">Analisis cerdas data absensi Google Sheets oleh Google Gemini</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-reanalyze-ai"
              onClick={handleRefreshAI}
              disabled={loadingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
              <span>ANALISIS ULANG</span>
            </button>
            <button
              id="btn-goto-ai-full"
              onClick={() => onNavigateTab('ai-analysis')}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <span>Tanya AI Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Insight Text Block */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-200 leading-relaxed">
          {aiInsight ? (
            <p className="font-medium text-slate-100">{aiInsight.insight}</p>
          ) : (
            <p className="text-slate-400 italic">Sistem siap. Mulai buka sesi absensi untuk mendapatkan analisis kehadiran otomatis dari AI Gemini.</p>
          )}
        </div>

        {/* AI Quick Recommendations pills */}
        {aiInsight?.rekomendasi && (
          <div className="mt-3 flex flex-wrap gap-2">
            {aiInsight.rekomendasi.slice(0, 2).map((rec, i) => (
              <span
                key={i}
                className="text-xs bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1 rounded-full flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                {rec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Attendance Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Distribusi Kehadiran per Kelas</h2>
              <p className="text-xs text-slate-400">Statistik Hadir, Izin, Sakit, Alfa</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-blue-400 border border-slate-700">
              Rata-rata: {stats?.persentase_kehadiran || 0}%
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {classBarData.length === 0 ? (
              <div className="text-center text-slate-500 text-xs">
                Belum ada data kelas untuk ditampilkan pada grafik.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Izin" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sakit" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Alfa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Percentage Breakdown Pie */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Rasio Kehadiran Global</h2>
            <p className="text-xs text-slate-400 mb-2">Persentase status presensi</p>

            <div className="h-44 w-full flex items-center justify-center">
              {statusPieData.length === 0 ? (
                <div className="text-center text-slate-500 text-xs">
                  Belum ada rekaman presensi.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Hadir: {stats?.hadir || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Izin: {stats?.izin || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-slate-300">Sakit: {stats?.sakit || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Alfa: {stats?.alfa || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance Records Activity */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Aktivitas Absensi Terbaru</h2>
            <p className="text-xs text-slate-400">Rekaman masuk siswa terkini</p>
          </div>
          <button
            id="btn-view-all-report"
            onClick={() => onNavigateTab('report')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Lihat Rekap Lengkap</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-y border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentRecords.map((r) => (
                <tr key={r.attendance_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{r.nama_siswa}</td>
                  <td className="py-3 px-4 text-slate-400">{r.nis}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {r.nama_kelas}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{r.mata_pelajaran}</td>
                  <td className="py-3 px-4 text-slate-400">{r.waktu_absen}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                </tr>
              ))}
              {recentRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada rekaman absensi. Sesi absensi yang telah diisi siswa akan muncul di sini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Session Modal */}
      <OpenSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schedules={schedules}
        onSessionCreated={handleSessionCreated}
        activeSession={activeSession}
      />
    </div>
  );
};
