import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  QrCode,
  FileSpreadsheet,
  Sparkles,
  Settings,
  LogOut,
  UserCheck,
  History,
  User as UserIcon,
  X,
  Radio,
  LucideIcon,
  Shield,
  Briefcase,
} from 'lucide-react';
import { UserRole } from '../types';

export type TeacherTab =
  | 'dashboard'
  | 'teachers'
  | 'classes'
  | 'students'
  | 'schedule'
  | 'attendance'
  | 'report'
  | 'ai-analysis'
  | 'settings';

export type StudentTab = 'dashboard' | 'attendance' | 'history' | 'schedule' | 'profile';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  highlight?: boolean;
}

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  activeSessionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeTab,
  onSelectTab,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  activeSessionCount = 0,
}) => {
  const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'teachers', label: 'Data Guru', icon: Briefcase },
    { id: 'classes', label: 'Data Kelas', icon: GraduationCap },
    { id: 'students', label: 'Data Siswa', icon: Users },
    { id: 'schedule', label: 'Jadwal Pelajaran', icon: Calendar },
    {
      id: 'attendance',
      label: 'Sesi Absensi',
      icon: QrCode,
      badge: activeSessionCount > 0 ? `${activeSessionCount} Aktif` : undefined,
    },
    { id: 'report', label: 'Rekap Absensi', icon: FileSpreadsheet },
    { id: 'ai-analysis', label: 'Analisis AI', icon: Sparkles, highlight: true },
    { id: 'settings', label: 'Pengaturan & DB', icon: Settings },
  ];

  const teacherMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'Kelas Saya', icon: GraduationCap },
    { id: 'students', label: 'Data Siswa', icon: Users },
    { id: 'schedule', label: 'Jadwal Mengajar', icon: Calendar },
    {
      id: 'attendance',
      label: 'Sesi Absensi',
      icon: QrCode,
      badge: activeSessionCount > 0 ? `${activeSessionCount} Aktif` : undefined,
    },
    { id: 'report', label: 'Rekap Absensi', icon: FileSpreadsheet },
    { id: 'ai-analysis', label: 'Analisis AI', icon: Sparkles, highlight: true },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const studentMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'attendance',
      label: 'Absensi Sekarang',
      icon: UserCheck,
      badge: activeSessionCount > 0 ? 'Sesi Buka!' : undefined,
    },
    { id: 'history', label: 'Riwayat Absensi', icon: History },
    { id: 'schedule', label: 'Jadwal Pelajaran', icon: Calendar },
    { id: 'profile', label: 'Profil Saya', icon: UserIcon },
  ];

  const menuItems =
    role === 'ADMIN'
      ? adminMenuItems
      : role === 'GURU'
      ? teacherMenuItems
      : studentMenuItems;

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-slate-200 border-r border-slate-800 p-4">
      {/* Top Branding / Mobile Header */}
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-sm text-white">Menu Navigasi</span>
          <button
            id="btn-close-sidebar-mobile"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="mb-4 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                role === 'ADMIN'
                  ? 'bg-purple-400'
                  : role === 'GURU'
                  ? 'bg-indigo-400'
                  : 'bg-emerald-400'
              } animate-pulse`}
            ></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {role === 'ADMIN'
                ? 'Portal Administrator'
                : role === 'GURU'
                ? 'Portal Guru'
                : 'Portal Siswa'}
            </span>
          </div>
          {activeSessionCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Radio className="w-2.5 h-2.5 animate-spin" /> Live
            </span>
          )}
        </div>

        {/* Menu list */}
        <nav className="space-y-1.5" aria-label="Menu Utama">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? role === 'ADMIN'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-semibold'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                    : item.highlight
                    ? 'text-indigo-300 hover:bg-indigo-500/10 hover:text-white border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-indigo-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom logout */}
      <div className="pt-4 border-t border-slate-800">
        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
