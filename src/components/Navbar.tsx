import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  LogOut,
  Clock,
  Database,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onQuickSwitchUser: (user: User) => void;
  onToggleSidebar?: () => void;
  onNavigateToSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onQuickSwitchUser,
  onToggleSidebar,
  onNavigateToSettings,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [sheetsStatus, setSheetsStatus] = useState<{ isConfigured: boolean; message: string } | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.getSheetsStatus().then((res) => {
      if (res.data) {
        setSheetsStatus(res.data);
      }
    });
  }, []);

  const demoAccounts: User[] = [
    {
      id: 'G001',
      guru_id: 'G001',
      username: 'guru_andi',
      nama: 'Andi Pratama, S.Pd.',
      role: 'GURU',
    },
    {
      id: 'G002',
      guru_id: 'G002',
      username: 'guru_siti',
      nama: 'Siti Nurhaliza, M.Pd.',
      role: 'GURU',
    },
    {
      id: 'S001',
      student_id: 'S001',
      nis: '12345',
      username: 'ahmad',
      nama: 'Ahmad Fauzan',
      kelas_id: 'K001',
      nama_kelas: 'XII IPS 1',
      role: 'SISWA',
    },
    {
      id: 'S019',
      student_id: 'S019',
      nis: '12363',
      username: 'siti',
      nama: 'Siti Rahma',
      kelas_id: 'K002',
      nama_kelas: 'XII MIPA 1',
      role: 'SISWA',
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900 border-b border-slate-800 text-slate-100 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            {currentUser && onToggleSidebar && (
              <button
                id="btn-toggle-sidebar"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                    DIGITAL CLASS ATTENDANCE
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Sparkles className="w-2.5 h-2.5" /> Next-Gen
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Sistem Absensi Digital Sekolah Modern
                </p>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-slate-200">{timeStr}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{dateStr}</span>
            </div>

            {/* Sheets Status Indicator */}
            <button
              id="btn-sheets-indicator"
              onClick={onNavigateToSettings}
              title={sheetsStatus?.message || 'Status Database Google Sheets'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                sheetsStatus?.isConfigured
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
              }`}
            >
              <Database className="w-3 h-3 text-indigo-400" />
              <span>{sheetsStatus?.isConfigured ? 'Sheets Live' : 'Database Ready'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* User quick switch / profile */}
                <div className="relative">
                  <button
                    id="btn-user-menu"
                    onClick={() => setSwitchOpen(!switchOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all text-left"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        currentUser.role === 'GURU'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {currentUser.nama.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-semibold text-white leading-none truncate max-w-[120px]">
                        {currentUser.nama}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            currentUser.role === 'GURU' ? 'bg-indigo-400' : 'bg-emerald-400'
                          }`}
                        ></span>
                        {currentUser.role === 'GURU' ? 'Guru' : `Siswa (${currentUser.nama_kelas || 'Kelas'})`}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Switch Menu Dropdown */}
                  {switchOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setSwitchOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Ganti Cepat Akun Demo
                        </p>
                      </div>
                      <div className="space-y-1">
                        {demoAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            id={`switch-to-${acc.username}`}
                            onClick={() => {
                              onQuickSwitchUser(acc);
                              setSwitchOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                              currentUser.id === acc.id
                                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  acc.role === 'GURU' ? 'bg-indigo-700 text-white' : 'bg-emerald-700 text-white'
                                }`}
                              >
                                {acc.role === 'GURU' ? 'G' : 'S'}
                              </div>
                              <div className="truncate">
                                <p className="font-medium truncate">{acc.nama}</p>
                                <p className="text-[10px] text-slate-400">
                                  {acc.role === 'GURU' ? 'Guru' : acc.nama_kelas}
                                </p>
                              </div>
                            </div>
                            {currentUser.id === acc.id && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Logout"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Keluar</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
