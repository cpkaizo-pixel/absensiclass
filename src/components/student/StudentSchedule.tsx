import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, UserCheck } from 'lucide-react';
import { Schedule, User } from '../../types';
import { api } from '../../lib/api';

export const StudentSchedule: React.FC<{ user: User }> = ({ user }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    api.getSchedules(user.kelas_id).then((res) => {
      if (res.data) setSchedules(res.data);
    });
  }, [user.kelas_id]);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Jadwal Pelajaran Kelas</h1>
        <p className="text-sm text-slate-400">
          Jadwal mata pelajaran mingguan untuk kelas <strong className="text-blue-400">{user.nama_kelas}</strong>.
        </p>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day) => {
          const daySchedules = schedules.filter((s) => s.hari === day);
          return (
            <div
              key={day}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-sm text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {day}
                </span>
                <span className="text-[11px] text-slate-500">{daySchedules.length} Pelajaran</span>
              </div>

              <div className="space-y-2.5">
                {daySchedules.map((sch) => (
                  <div
                    key={sch.schedule_id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{sch.mata_pelajaran}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {sch.jam_mulai} - {sch.jam_selesai}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Guru: {sch.nama_guru}</p>
                  </div>
                ))}

                {daySchedules.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-3 text-center">
                    Tidak ada jadwal pelajaran.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
