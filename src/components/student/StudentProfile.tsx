import React from 'react';
import { User as UserIcon, GraduationCap, ShieldCheck, Key, CheckCircle2 } from 'lucide-react';
import { User } from '../../types';

export const StudentProfile: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Profil Siswa</h1>
        <p className="text-sm text-slate-400">Informasi identitas akun siswa terdaftar.</p>
      </div>

      {/* ID Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-2xl">
            {user.nama.charAt(0)}
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              KARTU DIGITAL SISWA
            </span>
            <h2 className="text-xl font-bold text-white">{user.nama}</h2>
            <p className="text-xs text-slate-400">Kelas {user.nama_kelas}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Nomor Induk Siswa (NIS):</span>
            <span className="text-blue-400 font-mono font-bold text-sm">{user.nis || '-'}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Username:</span>
            <span className="text-white font-mono font-semibold">@{user.username}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Kelas Terdaftar:</span>
            <span className="text-white font-bold">{user.nama_kelas}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Status Akun:</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            Akun ini diverifikasi untuk mengisi presensi mandiri pada jadwal kelas yang sedang berlangsung menggunakan 6-digit kode atau pemindaian QR Code.
          </p>
        </div>
      </div>
    </div>
  );
};
