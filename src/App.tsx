import React, { useState, useEffect } from 'react';
import { User } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/auth/LoginView';

// Teacher & Admin Views
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherTeachers } from './components/teacher/TeacherTeachers';
import { TeacherClasses } from './components/teacher/TeacherClasses';
import { TeacherStudents } from './components/teacher/TeacherStudents';
import { TeacherSchedule } from './components/teacher/TeacherSchedule';
import { TeacherAttendanceLive } from './components/teacher/TeacherAttendanceLive';
import { TeacherReport } from './components/teacher/TeacherReport';
import { TeacherAIAnalysis } from './components/teacher/TeacherAIAnalysis';
import { TeacherSettings } from './components/teacher/TeacherSettings';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentAttendanceSubmit } from './components/student/StudentAttendanceSubmit';
import { StudentHistory } from './components/student/StudentHistory';
import { StudentSchedule } from './components/student/StudentSchedule';
import { StudentProfile } from './components/student/StudentProfile';

import { api } from './lib/api';

const MainApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('dca_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeSessionCount, setActiveSessionCount] = useState<number>(0);

  const { showInfo } = useToast();

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dca_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dca_user');
    }
  }, [currentUser]);

  // Poll active session count
  useEffect(() => {
    if (!currentUser) return;
    const checkActive = async () => {
      const res = await api.getActiveSession(
        currentUser.role === 'SISWA' ? currentUser.kelas_id : undefined
      );
      if (res.data) {
        setActiveSessionCount(1);
      } else {
        setActiveSessionCount(0);
      }
    };
    checkActive();
    const interval = setInterval(checkActive, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleQuickSwitchUser = (newUser: User) => {
    setCurrentUser(newUser);
    setActiveTab('dashboard');
    showInfo(`Beralih ke akun ${newUser.nama} (${newUser.role})`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          currentUser={null}
          onLogout={() => {}}
          onQuickSwitchUser={() => {}}
        />
        <main className="flex-1">
          <LoginView onLoginSuccess={handleLoginSuccess} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onQuickSwitchUser={handleQuickSwitchUser}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        onNavigateToSettings={() => {
          if (currentUser.role === 'GURU' || currentUser.role === 'ADMIN') setActiveTab('settings');
        }}
      />

      {/* Main Layout with Persistent Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          role={currentUser.role}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onLogout={handleLogout}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          activeSessionCount={activeSessionCount}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentUser.role === 'ADMIN' || currentUser.role === 'GURU' ? (
            /* ADMIN & TEACHER MODULES */
            <>
              {activeTab === 'dashboard' && (
                <TeacherDashboard
                  user={currentUser}
                  onNavigateTab={(t) => setActiveTab(t)}
                />
              )}
              {activeTab === 'teachers' && <TeacherTeachers />}
              {activeTab === 'classes' && <TeacherClasses />}
              {activeTab === 'students' && <TeacherStudents />}
              {activeTab === 'schedule' && <TeacherSchedule />}
              {activeTab === 'attendance' && <TeacherAttendanceLive />}
              {activeTab === 'report' && <TeacherReport />}
              {activeTab === 'ai-analysis' && <TeacherAIAnalysis />}
              {activeTab === 'settings' && <TeacherSettings />}
            </>
          ) : (
            /* STUDENT MODULES */
            <>
              {activeTab === 'dashboard' && (
                <StudentDashboard
                  user={currentUser}
                  onNavigateTab={(t) => setActiveTab(t)}
                />
              )}
              {activeTab === 'attendance' && (
                <StudentAttendanceSubmit
                  user={currentUser}
                  onSuccess={() => {}}
                />
              )}
              {activeTab === 'history' && <StudentHistory user={currentUser} />}
              {activeTab === 'schedule' && <StudentSchedule user={currentUser} />}
              {activeTab === 'profile' && <StudentProfile user={currentUser} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
