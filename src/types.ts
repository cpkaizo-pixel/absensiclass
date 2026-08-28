export type UserRole = 'ADMIN' | 'GURU' | 'SISWA';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  guru_id?: string;
  student_id?: string;
  nis?: string;
  kelas_id?: string;
  nama_kelas?: string;
}

export interface Student {
  student_id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  nama_kelas?: string;
  username: string;
  password_hash?: string;
  status: 'aktif' | 'nonaktif';
}

export interface Teacher {
  guru_id: string;
  nama: string;
  username: string;
  password_hash?: string;
  status: 'aktif' | 'nonaktif';
  mata_pelajaran_utama?: string;
}

export interface ClassRoom {
  kelas_id: string;
  nama_kelas: string;
  wali_kelas_id: string;
  nama_wali_kelas?: string;
  status: 'aktif' | 'nonaktif';
  total_siswa?: number;
}

export interface Schedule {
  schedule_id: string;
  kelas_id: string;
  nama_kelas?: string;
  guru_id: string;
  nama_guru?: string;
  mata_pelajaran: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jam_mulai: string;
  jam_selesai: string;
  status: 'aktif' | 'nonaktif';
}

export type SessionStatus = 'OPEN' | 'CLOSED';

export interface AttendanceSession {
  session_id: string;
  schedule_id: string;
  tanggal: string; // YYYY-MM-DD
  kode_absensi: string; // 6 digits
  qr_token: string;
  waktu_mulai: string; // HH:mm
  waktu_selesai: string; // HH:mm
  status: SessionStatus;
  durasi_menit?: number;
  expired_at_timestamp?: number;
  // Augmented details
  mata_pelajaran?: string;
  nama_guru?: string;
  nama_kelas?: string;
  kelas_id?: string;
  total_hadir?: number;
  total_siswa_kelas?: number;
}

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA';

export interface AttendanceRecord {
  attendance_id: string;
  session_id: string;
  student_id: string;
  tanggal: string;
  waktu_absen: string; // HH:mm:ss
  status: AttendanceStatus;
  keterangan: string;
  // Augmented details
  nama_siswa?: string;
  nis?: string;
  nama_kelas?: string;
  kelas_id?: string;
  mata_pelajaran?: string;
  nama_guru?: string;
}

export interface AttendanceStatistics {
  total_siswa: number;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  persentase_kehadiran: number;
  total_sesi_hari_ini: number;
  sesi_aktif: number;
  by_class?: {
    kelas_id: string;
    nama_kelas: string;
    total_siswa: number;
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
    persentase: number;
  }[];
}

export interface StudentRecapItem {
  student_id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  nama_kelas: string;
  total_pertemuan: number;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  persentase: number;
}

export interface SiswaPerluPerhatianItem {
  nama: string;
  nis?: string;
  alasan: string;
}

export interface AIAnalysisResponse {
  insight: string;
  ringkasan: string;
  statistik_ringkas?: {
    rata_rata_kehadiran: string;
    total_siswa_diperiksa: number;
    siswa_perlu_perhatian: string[];
    kelas_terbaik: string;
  };
  pola_kehadiran?: string[];
  siswa_perlu_perhatian?: SiswaPerluPerhatianItem[];
  rekomendasi: string[];
  analisis_detail?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  sheetsConnected?: boolean;
}
