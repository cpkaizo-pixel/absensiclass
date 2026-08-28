import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  User as UserIcon,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  FileSpreadsheet,
  QrCode,
  BrainCircuit,
  Info,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showError('Silakan masukkan username');
      return;
    }

    setLoading(true);
    try {
      const cleanUser = username.toLowerCase().trim();
      if (role === 'ADMIN' && cleanUser === 'admin') {
        const adminUser: User = {
          id: 'admin-master',
          username: 'admin',
          nama: 'Administrator Sistem',
          role: 'ADMIN',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('dca_user', JSON.stringify(adminUser));
        }
        showSuccess('Selamat datang, Administrator Sistem');
        onLoginSuccess(adminUser);
        setLoading(false);
        return;
      }

      const res = await api.login({ username, password, role });
      if (res.success && res.data) {
        showSuccess(res.message || `Login berhasil sebagai ${role}`);
        onLoginSuccess(res.data);
      } else {
        showError(res.message || 'Login gagal. Periksa username dan password Anda.');
      }
    } catch (err: any) {
      showError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background glowing accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/25 mb-4 text-white">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            DIGITAL CLASS ATTENDANCE
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sistem Presensi Digital Sekolah Modern • Dari 0 Siap Pakai
          </p>
        </div>

        {/* Card container */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Role selector tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              id="tab-role-admin"
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                role === 'ADMIN'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>

            <button
              id="tab-role-guru"
              type="button"
              onClick={() => handleRoleChange('GURU')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                role === 'GURU'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Guru</span>
            </button>

            <button
              id="tab-role-siswa"
              type="button"
              onClick={() => handleRoleChange('SISWA')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                role === 'SISWA'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Siswa</span>
            </button>
          </div>

          {/* System zero state notice */}
          {role === 'ADMIN' && (
            <div className="mb-5 p-3 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-start gap-2.5 text-xs text-purple-200">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-300">Akun Admin Khusus Siap:</span>
                <p className="mt-0.5 text-purple-300/80">
                  Data dimulai dari 0 (bersih). Masuk sebagai Admin untuk mulai menambahkan Kelas, Guru, Siswa, dan Jadwal.
                </p>
              </div>
            </div>
          )}

          {role !== 'ADMIN' && (
            <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p>
                  Akun {role === 'GURU' ? 'Guru' : 'Siswa'} didaftarkan oleh Administrator melalui menu Manajemen Data.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="input-username"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                {role === 'ADMIN' ? 'Username Admin' : role === 'GURU' ? 'Username Guru' : 'Username / NIS Siswa'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="input-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    role === 'ADMIN'
                      ? 'admin'
                      : role === 'GURU'
                      ? 'contoh: guru_andi'
                      : 'contoh: nis atau username siswa'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={role === 'ADMIN' ? 'admin123' : 'Password akun'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                role === 'ADMIN'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/25'
                  : role === 'GURU'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
              } disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    Masuk sebagai {role === 'ADMIN' ? 'Administrator' : role === 'GURU' ? 'Guru' : 'Siswa'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Login for Admin */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <button
              id="btn-quick-admin-login"
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setUsername('admin');
                setPassword('admin123');
              }}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500 flex items-center justify-between text-left transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  Akun Default Admin
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Username: <code className="text-slate-200 font-mono">admin</code> | Password: <code className="text-slate-200 font-mono">admin123</code>
                </div>
              </div>
              <span className="text-xs text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                Pilih →
              </span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-slate-400">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <QrCode className="w-5 h-5 mx-auto mb-1.5 text-blue-400" />
            <span className="font-medium text-slate-300 block">QR & 6-Digit</span>
            Absensi Presisi
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <FileSpreadsheet className="w-5 h-5 mx-auto mb-1.5 text-emerald-400" />
            <span className="font-medium text-slate-300 block">Google Sheets</span>
            Database Fleksibel
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <BrainCircuit className="w-5 h-5 mx-auto mb-1.5 text-indigo-400" />
            <span className="font-medium text-slate-300 block">Gemini AI</span>
            Analitik Kehadiran
          </div>
        </div>
      </div>
    </div>
  );
};
