import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  KeyRound,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Radio,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, AttendanceSession, AttendanceRecord } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

interface StudentAttendanceSubmitProps {
  user: User;
  onSuccess?: () => void;
}

export const StudentAttendanceSubmit: React.FC<StudentAttendanceSubmitProps> = ({
  user,
  onSuccess,
}) => {
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [kodeInput, setKodeInput] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [successRecord, setSuccessRecord] = useState<AttendanceRecord | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<string>('');

  const scannerRef = useRef<any>(null);
  const { showSuccess, showError, showWarning } = useToast();

  const loadActiveSession = async () => {
    try {
      const res = await api.getActiveSession(user.kelas_id);
      if (res.data) {
        setActiveSession(res.data);
      } else {
        setActiveSession(null);
      }
    } catch {
      setActiveSession(null);
    }
  };

  useEffect(() => {
    loadActiveSession();
    const interval = setInterval(loadActiveSession, 6000);
    return () => clearInterval(interval);
  }, [user.kelas_id]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitAttendance = async (codeToSubmit?: string) => {
    const code = (codeToSubmit || kodeInput).trim();
    if (!code) {
      showError('Masukkan 6-digit kode absensi atau scan QR code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitAttendance({
        kode_absensi: code,
        student_id: user.id,
        keterangan: keterangan || undefined,
      });

      if (res.success && res.data) {
        setSuccessRecord(res.data);
        showSuccess(res.message || 'Absensi berhasil dicatat!');
        triggerConfetti();
        setKodeInput('');
        setKeterangan('');
        if (onSuccess) onSuccess();
      } else {
        showError(res.message || 'Gagal melakukan absensi');
      }
    } catch (err: any) {
      showError('Terjadi kesalahan saat memproses absensi.');
    } finally {
      setLoading(false);
    }
  };

  // Start HTML5 QR Scanner
  const startScanner = async () => {
    setScannerActive(true);
    setScanningStatus('Mengaktifkan kamera scanner...');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Scanned successfully
          setScanningStatus(`QR Terdeteksi: ${decodedText}`);
          html5QrCode.stop().then(() => {
            setScannerActive(false);
            handleSubmitAttendance(decodedText);
          });
        },
        (errorMessage) => {
          // Ignore frame parse errors
        }
      );
    } catch (err) {
      setScanningStatus('Kamera tidak dapat diakses atau izin belum diberikan.');
      showWarning('Gunakan input 6-digit kode absensi jika kamera tidak tersedia.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-black text-white tracking-tight">Presensi Absensi Sekarang</h1>
        <p className="text-sm text-slate-400">
          Masukkan 6-digit kode yang diberikan Guru di kelas atau scan QR Code di papan tulis/proyektor.
        </p>
      </div>

      {/* Active Session Alert Banner */}
      {activeSession ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  SESI ABSENSI KELASMU SEDANG DIBUKA
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {activeSession.mata_pelajaran} — {activeSession.nama_kelas}
              </h3>
              <p className="text-xs text-slate-400">
                Pengajar: {activeSession.nama_guru} • Sesi berakhir pukul {activeSession.waktu_selesai} WIB
              </p>
            </div>
          </div>
          <button
            onClick={() => setKodeInput(activeSession.kode_absensi)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold border border-emerald-500/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pakai Kode Ini</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            Saat ini belum ada sesi yang dibuka otomatis untuk kelas Anda. Anda tetap dapat memasukkan 6-digit kode absensi yang diberikan oleh Guru.
          </span>
        </div>
      )}

      {/* Success Record Card If Submitted */}
      {successRecord && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                PRESENSI BERHASIL DICATAT
              </span>
              <h2 className="text-xl font-black text-white">Status: HADIR</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Nama Siswa:</span>
              <strong className="text-white">{successRecord.nama_siswa}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">NIS:</span>
              <strong className="text-blue-400 font-mono">{successRecord.nis}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Kelas:</span>
              <strong className="text-white">{successRecord.nama_kelas}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Mata Pelajaran:</span>
              <strong className="text-white">{successRecord.mata_pelajaran}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Tanggal:</span>
              <strong className="text-slate-200">{successRecord.tanggal}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Waktu Presensi:</span>
              <strong className="text-emerald-400 font-mono">{successRecord.waktu_absen} WIB</strong>
            </div>
          </div>

          <p className="text-xs text-emerald-300 font-medium text-center">
            ✓ Data absensi Anda telah tersimpan secara otomatis ke Google Sheets.
          </p>
        </div>
      )}

      {/* Input Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Input 6-Digit Code */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Opsi 1: Masukkan 6-Digit Kode
              </h2>
              <p className="text-xs text-slate-400">Kode angka dari Guru pengajar</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kode Absensi (6 Digit)
              </label>
              <input
                id="input-attendance-code"
                type="text"
                maxLength={6}
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="misal: 482910"
                className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="contoh: Hadir di kelas"
                className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              id="btn-submit-attendance-code"
              type="button"
              disabled={loading || kodeInput.length < 5}
              onClick={() => handleSubmitAttendance()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>KIRIM ABSENSI SEKARANG</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Method 2: Scan QR Code */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Opsi 2: Scan QR Code
                </h2>
                <p className="text-xs text-slate-400">Gunakan kamera smartphone/laptop</p>
              </div>
            </div>

            {/* Scanner Container */}
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 min-h-[180px] flex flex-col items-center justify-center">
              {scannerActive ? (
                <div className="w-full">
                  <div id="qr-reader-container" className="w-full rounded-lg overflow-hidden" />
                  <p className="text-[11px] text-slate-400 text-center mt-2">{scanningStatus}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Arahkan kamera ke QR Code yang ditampilkan oleh Guru
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            {scannerActive ? (
              <button
                type="button"
                onClick={stopScanner}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Hentikan Scanner
              </button>
            ) : (
              <button
                id="btn-start-camera-scanner"
                type="button"
                onClick={startScanner}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Kamera Scanner QR</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
