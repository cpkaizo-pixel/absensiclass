import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Clock,
  CheckCircle2,
  Maximize2,
  Users,
  Copy,
  Check,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { Schedule, AttendanceSession, AttendanceRecord } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

interface OpenSessionModalProps {
  schedules: Schedule[];
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (session: AttendanceSession & { qr_code_image: string }) => void;
  activeSession?: (AttendanceSession & { qr_code_image?: string }) | null;
}

export const OpenSessionModal: React.FC<OpenSessionModalProps> = ({
  schedules,
  isOpen,
  onClose,
  onSessionCreated,
  activeSession,
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [durasiMenit, setDurasiMenit] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreenQR, setFullscreenQR] = useState(false);
  const [recentAttendees, setRecentAttendees] = useState<AttendanceRecord[]>([]);

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (schedules.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(schedules[0].schedule_id);
    }
  }, [schedules, selectedScheduleId]);

  // Poll live attendees for active session
  useEffect(() => {
    if (!activeSession) return;
    const fetchAttendees = async () => {
      const res = await api.getHistory({ session_id: activeSession.session_id });
      if (res.data) {
        setRecentAttendees(res.data);
      }
    };
    fetchAttendees();
    const interval = setInterval(fetchAttendees, 3000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!isOpen) return null;

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      showError('Pilih jadwal kelas terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createSession({
        schedule_id: selectedScheduleId,
        durasi_menit: durasiMenit,
      });

      if (res.success && res.data) {
        showSuccess(`Sesi absensi dibuka! Kode: ${res.data.kode_absensi}`);
        onSessionCreated(res.data);
      } else {
        showError(res.message || 'Gagal membuka sesi absensi');
      }
    } catch (err: any) {
      showError('Terjadi kesalahan saat membuka sesi');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showSuccess('Kode absensi berhasil disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseActiveSession = async () => {
    if (!activeSession) return;
    try {
      await api.closeSession(activeSession.session_id);
      showSuccess('Sesi absensi telah ditutup');
      onClose();
    } catch {
      showError('Gagal menutup sesi absensi');
    }
  };

  const selectedSchedule = schedules.find((s) => s.schedule_id === selectedScheduleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {activeSession ? 'Sesi Absensi Aktif' : 'Buka Sesi Absensi Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeSession
                  ? 'Siswa dapat scan QR atau memasukkan 6-digit kode'
                  : 'Pilih kelas & durasi untuk generate QR & kode absensi'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeSession ? (
            /* Active Session Display */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                      STATUS: SESI SEDANG BERLANGSUNG
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {activeSession.mata_pelajaran} — {activeSession.nama_kelas}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Guru: {activeSession.nama_guru} • Waktu: {activeSession.waktu_mulai} -{' '}
                    {activeSession.waktu_selesai} WIB
                  </p>
                </div>
                <button
                  id="btn-modal-close-session"
                  onClick={handleCloseActiveSession}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all"
                >
                  Tutup Sesi
                </button>
              </div>

              {/* Big 6-digit Code & QR Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* 6 Digit Code Box */}
                <div className="text-center p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Kode Absensi 6-Digit
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-widest my-2">
                    {activeSession.kode_absensi}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Siswa memasukkan kode ini di halaman "Absensi Sekarang"
                  </p>
                  <button
                    id="btn-copy-code"
                    onClick={() => handleCopyCode(activeSession.kode_absensi)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>

                {/* QR Code Box */}
                <div className="text-center p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Scan QR Code
                  </span>
                  {activeSession.qr_code_image ? (
                    <div className="p-2 bg-white rounded-xl shadow-lg my-1">
                      <img
                        src={activeSession.qr_code_image}
                        alt="QR Code Absensi"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-slate-600 bg-slate-900 rounded-xl">
                      QR Code
                    </div>
                  )}
                  <button
                    id="btn-fullscreen-qr"
                    onClick={() => setFullscreenQR(true)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Tampilkan Layar Penuh (Proyektor)
                  </button>
                </div>
              </div>

              {/* Real-time Attendees List */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Siswa Sudah Absen ({recentAttendees.length})
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Real-time Live
                  </span>
                </div>

                {recentAttendees.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Belum ada siswa yang absen. Menunggu siswa memasukkan kode / scan QR...
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {recentAttendees.map((att, idx) => (
                      <div
                        key={att.attendance_id || idx}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-white">{att.nama_siswa}</span>
                          <span className="text-slate-500">NIS: {att.nis}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{att.waktu_absen}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            HADIR
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Create Session Form */
            <form onSubmit={handleOpenSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Pilih Jadwal Pelajaran & Kelas
                </label>
                <div className="space-y-2">
                  {schedules.map((sch) => {
                    const isSelected = selectedScheduleId === sch.schedule_id;
                    return (
                      <div
                        key={sch.schedule_id}
                        onClick={() => setSelectedScheduleId(sch.schedule_id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{sch.mata_pelajaran}</span>
                            <span className="px-2 py-0.5 text-[10px] rounded-md bg-blue-500/20 text-blue-300 font-semibold">
                              {sch.nama_kelas}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Hari {sch.hari} • {sch.jam_mulai} - {sch.jam_selesai} WIB • Guru: {sch.nama_guru}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Durasi Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Durasi Sesi Absensi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 30, 45, 60].slice(0, 4).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurasiMenit(m)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        durasiMenit === m
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {m} Menit
                    </button>
                  ))}
                </div>
              </div>

              {selectedSchedule && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-white">Ringkasan Sesi yang Akan Dibuka:</div>
                  <div>• Kelas: <span className="text-blue-400 font-semibold">{selectedSchedule.nama_kelas}</span></div>
                  <div>• Mata Pelajaran: <span className="text-blue-400 font-semibold">{selectedSchedule.mata_pelajaran}</span></div>
                  <div>• Durasi: <span className="text-emerald-400 font-semibold">{durasiMenit} Menit</span></div>
                </div>
              )}

              <button
                id="btn-start-session-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>BUKA ABSENSI SEKARANG</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Fullscreen QR Code Overlay for Classroom Projector */}
      {fullscreenQR && activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white animate-in zoom-in-95">
          <button
            onClick={() => setFullscreenQR(false)}
            className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center max-w-xl">
            <h1 className="text-3xl font-black mb-1 text-blue-400">{activeSession.mata_pelajaran}</h1>
            <p className="text-lg text-slate-300 mb-6">
              Kelas: <span className="font-bold text-white">{activeSession.nama_kelas}</span> • Guru:{' '}
              {activeSession.nama_guru}
            </p>

            <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl shadow-blue-500/20 mb-6">
              <img
                src={activeSession.qr_code_image}
                alt="QR Fullscreen"
                className="w-80 h-80 object-contain mx-auto"
              />
            </div>

            <div className="text-2xl font-semibold text-slate-300 mb-2">Atau Masukkan Kode 6-Digit:</div>
            <div className="text-6xl font-black text-amber-400 tracking-widest py-2">
              {activeSession.kode_absensi}
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Buka aplikasi di smartphone/laptop dan pilih menu "Absensi Sekarang"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
