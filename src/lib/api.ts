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

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        message: 'Endpoint server lokal tidak aktif (Static SPA Mode)',
      };
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      return {
        success: false,
        message: 'Endpoint tidak mengembalikan data',
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Format data tidak valid',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal terhubung ke server',
    };
  }
}

// Direct Apps Script Helper
async function fetchAppsScript<T>(action: string, payload: Record<string, any> = {}): Promise<ApiResponse<T>> {
  const url = getCustomAppsScriptUrl();
  if (!url) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi di Pengaturan.',
    };
  }

  try {
    const cleanUrl = url.trim();
    const fullPayload = { action, ...payload };
    const res = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(fullPayload),
    });
    const text = await res.text();
    if (!text || !text.trim()) {
      return {
        success: false,
        message: 'Google Apps Script tidak mengembalikan respons.',
      };
    }
    return JSON.parse(text);
  } catch (err: any) {
    try {
      // Fallback to GET query params
      const cleanUrl = url.trim();
      const params = new URLSearchParams({ action, ...payload });
      const target = cleanUrl.includes('?') ? `${cleanUrl}&${params.toString()}` : `${cleanUrl}?${params.toString()}`;
      const res = await fetch(target, { method: 'GET' });
      const text = await res.text();
      if (!text || !text.trim()) {
        return {
          success: false,
          message: 'Google Apps Script tidak mengembalikan data (GET).',
        };
      }
      return JSON.parse(text);
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: 'Gagal menghubungi Google Apps Script. Pastikan Web App diset ke "Anyone" (Siapa saja).',
      };
    }
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

  // Auth (Always succeeds for Master Admin, queries backend or Apps Script for others)
  login: async (credentials: { username: string; password?: string; role: UserRole }): Promise<ApiResponse<User>> => {
    const cleanUser = credentials.username?.toLowerCase().trim();

    // 1. MASTER ADMIN LOGIN (Always works reliably)
    if (credentials.role === 'ADMIN' || cleanUser === 'admin') {
      if (cleanUser === 'admin') {
        const adminUser: User = {
          id: 'admin-master',
          username: 'admin',
          nama: 'Administrator Sistem',
          role: 'ADMIN',
        };
        // Persist session
        if (typeof window !== 'undefined') {
          localStorage.setItem('dca_user', JSON.stringify(adminUser));
        }
        return {
          success: true,
          message: 'Selamat datang, Administrator Sistem',
          data: adminUser,
        };
      }
      return {
        success: false,
        message: 'Username Admin harus berupa "admin".',
      };
    }

    // 2. Try Node Express Server endpoint first
    const res = await fetchJson<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (res.success && res.data) {
      return res;
    }

    // 3. If server endpoint is offline (e.g. Vercel static mode), check Google Apps Script
    const appsScriptUrl = getCustomAppsScriptUrl();
    if (appsScriptUrl) {
      if (credentials.role === 'GURU') {
        const teacherRes = await fetchAppsScript<Teacher[]>('getTeachers');
        if (teacherRes.success && Array.isArray(teacherRes.data)) {
          const teacher = teacherRes.data.find(
            (t) => t.username?.toLowerCase() === cleanUser
          );
          if (teacher) {
            return {
              success: true,
              message: `Selamat datang, ${teacher.nama}`,
              data: {
                id: teacher.guru_id,
                guru_id: teacher.guru_id,
                username: teacher.username,
                nama: teacher.nama,
                role: 'GURU',
              },
            };
          }
        }
        return {
          success: false,
          message: 'Akun Guru tidak ditemukan di database Google Sheets.',
        };
      } else if (credentials.role === 'SISWA') {
        const studentRes = await fetchAppsScript<Student[]>('getStudents');
        if (studentRes.success && Array.isArray(studentRes.data)) {
          const student = studentRes.data.find(
            (s) =>
              s.username?.toLowerCase() === cleanUser ||
              s.nis === credentials.username.trim()
          );
          if (student) {
            return {
              success: true,
              message: `Selamat datang, ${student.nama}`,
              data: {
                id: student.student_id,
                student_id: student.student_id,
                nis: student.nis,
                username: student.username,
                nama: student.nama,
                kelas_id: student.kelas_id,
                role: 'SISWA',
              },
            };
          }
        }
        return {
          success: false,
          message: 'Akun Siswa atau NIS tidak ditemukan di database Google Sheets.',
        };
      }
    }

    return {
      success: false,
      message: res.message || 'Login gagal. Periksa username atau koneksi Google Sheets Anda.',
    };
  },

  // Status
  getSheetsStatus: async () => {
    const res = await fetchJson<{
      isConfigured: boolean;
      mode: string;
      sheetId: string | null;
      clientEmail: string | null;
      message: string;
    }>('/api/sheets/status');

    if (res.success) return res;

    // Check if Apps Script is configured
    const scriptUrl = getCustomAppsScriptUrl();
    return {
      success: true,
      data: {
        isConfigured: !!scriptUrl,
        mode: scriptUrl ? 'APPS_SCRIPT' : 'STANDALONE',
        sheetId: null,
        clientEmail: null,
        message: scriptUrl ? 'Terhubung via Google Apps Script Web App' : 'Mode Mandiri / Apps Script siap dikonfigurasi',
      },
    };
  },

  // Students
  getStudents: async (kelasId?: string) => {
    const res = await fetchJson<Student[]>(`/api/students${kelasId ? `?kelas_id=${kelasId}` : ''}`);
    if (res.success && Array.isArray(res.data)) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<Student[]>('getStudents', { kelas_id: kelasId });
    }
    return res;
  },
  addStudent: async (data: Partial<Student>) => {
    const res = await fetchJson<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<Student>('addStudent', data);
    }
    return res;
  },
  deleteStudent: async (id: string) => {
    const res = await fetchJson<void>(`/api/students/${id}`, {
      method: 'DELETE',
    });
    if (res.success) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<void>('deleteStudent', { student_id: id });
    }
    return res;
  },

  // Teachers
  getTeachers: async () => {
    const res = await fetchJson<Teacher[]>('/api/teachers');
    if (res.success && Array.isArray(res.data)) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<Teacher[]>('getTeachers');
    }
    return res;
  },
  addTeacher: async (data: Partial<Teacher>) => {
    const res = await fetchJson<Teacher>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<Teacher>('addTeacher', data);
    }
    return res;
  },
  deleteTeacher: async (id: string) => {
    const res = await fetchJson<void>(`/api/teachers/${id}`, {
      method: 'DELETE',
    });
    if (res.success) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<void>('deleteTeacher', { guru_id: id });
    }
    return res;
  },

  // Classes
  getClasses: async () => {
    const res = await fetchJson<ClassRoom[]>('/api/classes');
    if (res.success && Array.isArray(res.data)) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<ClassRoom[]>('getClasses');
    }
    return res;
  },
  addClass: async (data: Partial<ClassRoom>) => {
    const res = await fetchJson<ClassRoom>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<ClassRoom>('addClass', data);
    }
    return res;
  },
  deleteClass: async (id: string) => {
    const res = await fetchJson<void>(`/api/classes/${id}`, {
      method: 'DELETE',
    });
    if (res.success) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<void>('deleteClass', { kelas_id: id });
    }
    return res;
  },

  // Schedules
  getSchedules: async (kelasId?: string, guruId?: string) => {
    const params = new URLSearchParams();
    if (kelasId) params.append('kelas_id', kelasId);
    if (guruId) params.append('guru_id', guruId);
    const res = await fetchJson<Schedule[]>(`/api/schedules?${params.toString()}`);
    if (res.success && Array.isArray(res.data)) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<Schedule[]>('getSchedules', { kelas_id: kelasId, guru_id: guruId });
    }
    return res;
  },
  addSchedule: async (data: Partial<Schedule>) => {
    const res = await fetchJson<Schedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<Schedule>('addSchedule', data);
    }
    return res;
  },
  deleteSchedule: async (id: string) => {
    const res = await fetchJson<void>(`/api/schedules/${id}`, {
      method: 'DELETE',
    });
    if (res.success) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<void>('deleteSchedule', { schedule_id: id });
    }
    return res;
  },

  // Sessions
  createSession: async (data: { schedule_id: string; durasi_menit: number; tanggal?: string }) => {
    const res = await fetchJson<AttendanceSession & { qr_code_image: string }>('/api/attendance/session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<AttendanceSession & { qr_code_image: string }>('createSession', data);
    }
    return res;
  },
  closeSession: async (session_id: string) => {
    const res = await fetchJson<void>('/api/attendance/session/close', {
      method: 'POST',
      body: JSON.stringify({ session_id }),
    });
    if (res.success) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<void>('closeSession', { session_id });
    }
    return res;
  },
  getActiveSession: async (kelasId?: string) => {
    const res = await fetchJson<(AttendanceSession & { qr_code_image?: string }) | null>(
      `/api/attendance/session/active${kelasId ? `?kelas_id=${kelasId}` : ''}`
    );
    if (res.success) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<(AttendanceSession & { qr_code_image?: string }) | null>('getActiveSession', { kelas_id: kelasId });
    }
    return res;
  },
  getAllSessions: async () => {
    const res = await fetchJson<AttendanceSession[]>('/api/attendance/session/all');
    if (res.success && Array.isArray(res.data)) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<AttendanceSession[]>('getSessions');
    }
    return res;
  },

  // Attendance
  submitAttendance: async (data: { kode_absensi: string; student_id: string; keterangan?: string }) => {
    const res = await fetchJson<AttendanceRecord>('/api/attendance/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<AttendanceRecord>('submitAttendance', data);
    }
    return res;
  },
  getHistory: async (params?: { session_id?: string; student_id?: string; kelas_id?: string; tanggal?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.session_id) searchParams.append('session_id', params.session_id);
    if (params?.student_id) searchParams.append('student_id', params.student_id);
    if (params?.kelas_id) searchParams.append('kelas_id', params.kelas_id);
    if (params?.tanggal) searchParams.append('tanggal', params.tanggal);
    const res = await fetchJson<AttendanceRecord[]>(`/api/attendance/history?${searchParams.toString()}`);
    if (res.success && Array.isArray(res.data)) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<AttendanceRecord[]>('getAttendanceHistory', params);
    }
    return res;
  },
  updateStatus: async (attendance_id: string, status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA', keterangan?: string) => {
    const res = await fetchJson<void>('/api/attendance/update-status', {
      method: 'POST',
      body: JSON.stringify({ attendance_id, status, keterangan }),
    });
    if (res.success) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<void>('updateAttendanceStatus', { attendance_id, status, keterangan });
    }
    return res;
  },
  getStatistics: async (kelasId?: string) => {
    const res = await fetchJson<AttendanceStatistics>(`/api/attendance/statistics${kelasId ? `?kelas_id=${kelasId}` : ''}`);
    if (res.success && res.data) return res;
    if (getCustomAppsScriptUrl()) {
      return fetchAppsScript<AttendanceStatistics>('getStatistics', { kelas_id: kelasId });
    }
    return res;
  },

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
