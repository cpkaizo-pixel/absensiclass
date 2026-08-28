import { Student, Teacher, ClassRoom, Schedule, AttendanceSession, AttendanceRecord, User } from '../types';

export const DEFAULT_ADMIN_ACCOUNT: User & { password: string } = {
  id: 'ADMIN001',
  username: 'admin',
  password: 'admin123',
  nama: 'Administrator Sistem',
  role: 'ADMIN',
};

// Start clean from 0 (empty database)
export const INITIAL_CLASSES: ClassRoom[] = [];
export const INITIAL_TEACHERS: Teacher[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_SCHEDULES: Schedule[] = [];
export const INITIAL_SESSIONS: AttendanceSession[] = [];
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

// Sample backup data if user chooses to seed/demo later
export const SAMPLE_CLASSES: ClassRoom[] = [
  {
    kelas_id: 'K001',
    nama_kelas: 'XII IPS 1',
    wali_kelas_id: 'G001',
    nama_wali_kelas: 'Andi Pratama, S.Pd.',
    status: 'aktif',
    total_siswa: 4,
  },
  {
    kelas_id: 'K002',
    nama_kelas: 'XII MIPA 1',
    wali_kelas_id: 'G002',
    nama_wali_kelas: 'Siti Nurhaliza, M.Pd.',
    status: 'aktif',
    total_siswa: 4,
  },
];

export const SAMPLE_TEACHERS: Teacher[] = [
  {
    guru_id: 'G001',
    nama: 'Andi Pratama, S.Pd.',
    username: 'guru_andi',
    status: 'aktif',
    mata_pelajaran_utama: 'Ekonomi',
  },
  {
    guru_id: 'G002',
    nama: 'Siti Nurhaliza, M.Pd.',
    username: 'guru_siti',
    status: 'aktif',
    mata_pelajaran_utama: 'Matematika Wajib',
  },
];

export const SAMPLE_STUDENTS: Student[] = [
  { student_id: 'S001', nis: '12345', nama: 'Ahmad Fauzan', kelas_id: 'K001', nama_kelas: 'XII IPS 1', username: 'ahmad', status: 'aktif' },
  { student_id: 'S002', nis: '12346', nama: 'Budi Santoso', kelas_id: 'K001', nama_kelas: 'XII IPS 1', username: 'budi', status: 'aktif' },
  { student_id: 'S003', nis: '12347', nama: 'Citra Dewi', kelas_id: 'K002', nama_kelas: 'XII MIPA 1', username: 'citra', status: 'aktif' },
  { student_id: 'S004', nis: '12348', nama: 'Dimas Anggara', kelas_id: 'K002', nama_kelas: 'XII MIPA 1', username: 'dimas', status: 'aktif' },
];

export const SAMPLE_SCHEDULES: Schedule[] = [
  { schedule_id: 'SCH001', kelas_id: 'K001', guru_id: 'G001', mata_pelajaran: 'Ekonomi', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', status: 'aktif' },
  { schedule_id: 'SCH002', kelas_id: 'K002', guru_id: 'G002', mata_pelajaran: 'Matematika Wajib', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', status: 'aktif' },
];
