import {
  ApiResponse,
  Student,
  Teacher,
  ClassRoom,
  Schedule,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatistics,
  AIAnalysisResponse,
  User,
  UserRole,
} from '../types';

export const APPS_SCRIPT_STORAGE_KEY = 'dca_apps_script_url';

export function getCustomAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(APPS_SCRIPT_STORAGE_KEY);
    if (saved) return saved.trim();
  }
  return ((import.meta as any).env?.VITE_APPS_SCRIPT_URL as string) || '';
}

export function setCustomAppsScriptUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (!url) {
      localStorage.removeItem(APPS_SCRIPT_STORAGE_KEY);
    } else {
      localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
    }
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal terhubung ke server',
    };
  }
}

export const api = {
  // Apps Script Helper
  getAppsScriptUrl: getCustomAppsScriptUrl,
  setAppsScriptUrl: setCustomAppsScriptUrl,
  testAppsScriptConnection: async (url: string) => {
    try {
      const cleanUrl = url.trim();
      const target = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const res = await fetch(target, { method: 'GET' });
      const data = await res.json();
      return { success: !!data.success, data, message: data.message || 'Terhubung ke Google Apps Script!' };
    } catch (e: any) {
      return { success: false, message: 'Gagal terhubung. Pastikan Web App di-deploy dengan akses "Anyone" (Siapa saja).' };
    }
  },

  // Auth
  login: (credentials: { username: string; password?: string; role: UserRole }) =>
    fetchJson<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Status
  getSheetsStatus: () =>
    fetchJson<{
      isConfigured: boolean;
      mode: string;
      sheetId: string | null;
      clientEmail: string | null;
      message: string;
    }>('/api/sheets/status'),

  // Students
  getStudents: (kelasId?: string) =>
    fetchJson<Student[]>(`/api/students${kelasId ? `?kelas_id=${kelasId}` : ''}`),
  addStudent: (data: Partial<Student>) =>
    fetchJson<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteStudent: (id: string) =>
    fetchJson<void>(`/api/students/${id}`, {
      method: 'DELETE',
    }),

  // Teachers
  getTeachers: () => fetchJson<Teacher[]>('/api/teachers'),
  addTeacher: (data: Partial<Teacher>) =>
    fetchJson<Teacher>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTeacher: (id: string) =>
    fetchJson<void>(`/api/teachers/${id}`, {
      method: 'DELETE',
    }),

  // Classes
  getClasses: () => fetchJson<ClassRoom[]>('/api/classes'),
  addClass: (data: Partial<ClassRoom>) =>
    fetchJson<ClassRoom>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteClass: (id: string) =>
    fetchJson<void>(`/api/classes/${id}`, {
      method: 'DELETE',
    }),

  // Schedules
  getSchedules: (kelasId?: string, guruId?: string) => {
    const params = new URLSearchParams();
    if (kelasId) params.append('kelas_id', kelasId);
    if (guruId) params.append('guru_id', guruId);
    return fetchJson<Schedule[]>(`/api/schedules?${params.toString()}`);
  },
  addSchedule: (data: Partial<Schedule>) =>
    fetchJson<Schedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSchedule: (id: string) =>
    fetchJson<void>(`/api/schedules/${id}`, {
      method: 'DELETE',
    }),

  // Sessions
  createSession: (data: { schedule_id: string; durasi_menit: number; tanggal?: string }) =>
    fetchJson<AttendanceSession & { qr_code_image: string }>('/api/attendance/session', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  closeSession: (session_id: string) =>
    fetchJson<void>('/api/attendance/session/close', {
      method: 'POST',
      body: JSON.stringify({ session_id }),
    }),
  getActiveSession: (kelasId?: string) =>
    fetchJson<(AttendanceSession & { qr_code_image?: string }) | null>(
      `/api/attendance/session/active${kelasId ? `?kelas_id=${kelasId}` : ''}`
    ),
  getAllSessions: () => fetchJson<AttendanceSession[]>('/api/attendance/session/all'),

  // Attendance
  submitAttendance: (data: { kode_absensi: string; student_id: string; keterangan?: string }) =>
    fetchJson<AttendanceRecord>('/api/attendance/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getHistory: (params?: { session_id?: string; student_id?: string; kelas_id?: string; tanggal?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.session_id) searchParams.append('session_id', params.session_id);
    if (params?.student_id) searchParams.append('student_id', params.student_id);
    if (params?.kelas_id) searchParams.append('kelas_id', params.kelas_id);
    if (params?.tanggal) searchParams.append('tanggal', params.tanggal);
    return fetchJson<AttendanceRecord[]>(`/api/attendance/history?${searchParams.toString()}`);
  },
  updateStatus: (attendance_id: string, status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA', keterangan?: string) =>
    fetchJson<void>('/api/attendance/update-status', {
      method: 'POST',
      body: JSON.stringify({ attendance_id, status, keterangan }),
    }),
  getStatistics: (kelasId?: string) =>
    fetchJson<AttendanceStatistics>(`/api/attendance/statistics${kelasId ? `?kelas_id=${kelasId}` : ''}`),

  // AI Gemini
  getAIAnalysis: (kelas_id?: string) =>
    fetchJson<AIAnalysisResponse>('/api/ai/analyze-attendance', {
      method: 'POST',
      body: JSON.stringify({ kelas_id }),
    }),
  askAI: (question: string, kelas_id?: string) =>
    fetchJson<{ answer: string }>('/api/ai/ask-attendance', {
      method: 'POST',
      body: JSON.stringify({ question, kelas_id }),
    }),

  // System
  resetDatabase: () =>
    fetchJson<{ message: string }>('/api/system/reset', {
      method: 'POST',
    }),
};
