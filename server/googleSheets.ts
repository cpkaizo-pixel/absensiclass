import { google, sheets_v4 } from 'googleapis';
import {
  Student,
  Teacher,
  ClassRoom,
  Schedule,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatistics,
} from '../src/types';
import {
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_CLASSES,
  INITIAL_SCHEDULES,
  INITIAL_SESSIONS,
  INITIAL_ATTENDANCE_RECORDS,
} from '../src/data/demoData';

// In-memory persistent cache / fallback datastore
class SheetsDataStore {
  students: Student[] = [...INITIAL_STUDENTS];
  teachers: Teacher[] = [...INITIAL_TEACHERS];
  classes: ClassRoom[] = [...INITIAL_CLASSES];
  schedules: Schedule[] = [...INITIAL_SCHEDULES];
  sessions: AttendanceSession[] = [...INITIAL_SESSIONS];
  attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE_RECORDS];
}

const localStore = new SheetsDataStore();

// Helper to get Google Sheets client if configured
function getGoogleSheetsClient(): { sheets: sheets_v4.Sheets; spreadsheetId: string } | null {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !spreadsheetId) {
    return null;
  }

  try {
    // Handle escaped newlines in private key string
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId };
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    return null;
  }
}

export function getSheetsConnectionStatus() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;

  const isConfigured = !!(email && hasKey && spreadsheetId);
  return {
    isConfigured,
    mode: isConfigured ? ('google_sheets_live' as const) : ('local_storage_ready' as const),
    sheetId: spreadsheetId ? `${spreadsheetId.slice(0, 6)}...${spreadsheetId.slice(-4)}` : null,
    clientEmail: email || null,
    message: isConfigured
      ? 'Google Sheets API connected live'
      : 'Using local resilient data store. Configure .env.local to sync directly to Google Sheets.',
  };
}

// 1. GET STUDENTS
export async function getStudents(kelasId?: string): Promise<Student[]> {
  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'SISWA!A2:G',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        let list: Student[] = rows.map((r) => ({
          student_id: r[0] || '',
          nis: r[1] || '',
          nama: r[2] || '',
          kelas_id: r[3] || '',
          username: r[4] || '',
          password_hash: r[5] || '',
          status: (r[6] || 'aktif') as 'aktif' | 'nonaktif',
        }));
        if (kelasId) {
          list = list.filter((s) => s.kelas_id === kelasId);
        }
        return list;
      }
    } catch (e) {
      console.warn('Google Sheets read error for SISWA, using fallback cache:', e);
    }
  }

  let list = localStore.students;
  if (kelasId) {
    list = list.filter((s) => s.kelas_id === kelasId);
  }
  return list;
}

// 2. GET TEACHERS
export async function getTeachers(): Promise<Teacher[]> {
  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'GURU!A2:E',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          guru_id: r[0] || '',
          nama: r[1] || '',
          username: r[2] || '',
          password_hash: r[3] || '',
          status: (r[4] || 'aktif') as 'aktif' | 'nonaktif',
        }));
      }
    } catch (e) {
      console.warn('Google Sheets read error for GURU, using fallback cache:', e);
    }
  }
  return localStore.teachers;
}

// 3. GET CLASSES
export async function getClasses(): Promise<ClassRoom[]> {
  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'KELAS!A2:D',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          kelas_id: r[0] || '',
          nama_kelas: r[1] || '',
          wali_kelas_id: r[2] || '',
          status: (r[3] || 'aktif') as 'aktif' | 'nonaktif',
        }));
      }
    } catch (e) {
      console.warn('Google Sheets read error for KELAS, using fallback cache:', e);
    }
  }
  return localStore.classes;
}

// 4. GET SCHEDULES
export async function getSchedules(kelasId?: string, guruId?: string): Promise<Schedule[]> {
  const gClient = getGoogleSheetsClient();
  let list = localStore.schedules;
  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'JADWAL!A2:H',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        list = rows.map((r) => ({
          schedule_id: r[0] || '',
          kelas_id: r[1] || '',
          guru_id: r[2] || '',
          mata_pelajaran: r[3] || '',
          hari: (r[4] || 'Senin') as any,
          jam_mulai: r[5] || '',
          jam_selesai: r[6] || '',
          status: (r[7] || 'aktif') as 'aktif' | 'nonaktif',
        }));
      }
    } catch (e) {
      console.warn('Google Sheets read error for JADWAL, using fallback cache:', e);
    }
  }

  if (kelasId) list = list.filter((s) => s.kelas_id === kelasId);
  if (guruId) list = list.filter((s) => s.guru_id === guruId);

  // Attach augmented names
  const classes = await getClasses();
  const teachers = await getTeachers();
  return list.map((sch) => {
    const cls = classes.find((c) => c.kelas_id === sch.kelas_id);
    const tch = teachers.find((t) => t.guru_id === sch.guru_id);
    return {
      ...sch,
      nama_kelas: cls ? cls.nama_kelas : sch.kelas_id,
      nama_guru: tch ? tch.nama : sch.guru_id,
    };
  });
}

// 5. GET ATTENDANCE SESSIONS
export async function getAttendanceSessions(statusFilter?: 'OPEN' | 'CLOSED'): Promise<AttendanceSession[]> {
  const gClient = getGoogleSheetsClient();
  let list = localStore.sessions;
  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'SESI_ABSENSI!A2:H',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        list = rows.map((r) => ({
          session_id: r[0] || '',
          schedule_id: r[1] || '',
          tanggal: r[2] || '',
          kode_absensi: r[3] || '',
          qr_token: r[4] || '',
          waktu_mulai: r[5] || '',
          waktu_selesai: r[6] || '',
          status: (r[7] || 'OPEN') as 'OPEN' | 'CLOSED',
        }));
      }
    } catch (e) {
      console.warn('Google Sheets read error for SESI_ABSENSI, using fallback cache:', e);
    }
  }

  const schedules = await getSchedules();
  const classes = await getClasses();
  const teachers = await getTeachers();
  const attendance = await getAttendance();

  const augmented = list.map((sess) => {
    const sch = schedules.find((s) => s.schedule_id === sess.schedule_id);
    const cls = sch ? classes.find((c) => c.kelas_id === sch.kelas_id) : undefined;
    const tch = sch ? teachers.find((t) => t.guru_id === sch.guru_id) : undefined;
    const sessAttendance = attendance.filter((a) => a.session_id === sess.session_id);

    return {
      ...sess,
      mata_pelajaran: sch ? sch.mata_pelajaran : 'Mata Pelajaran',
      nama_guru: tch ? tch.nama : sch?.guru_id,
      nama_kelas: cls ? cls.nama_kelas : sch?.kelas_id,
      kelas_id: sch?.kelas_id,
      total_hadir: sessAttendance.filter((a) => a.status === 'HADIR').length,
    };
  });

  if (statusFilter) {
    return augmented.filter((s) => s.status === statusFilter);
  }
  return augmented;
}

// 6. CREATE ATTENDANCE SESSION
export async function createAttendanceSession(params: {
  schedule_id: string;
  durasi_menit: number;
  tanggal?: string;
  kode_absensi?: string;
}): Promise<AttendanceSession> {
  const now = new Date();
  const tanggal = params.tanggal || now.toISOString().split('T')[0];
  const waktu_mulai = now.toTimeString().slice(0, 5); // HH:mm

  const endTimestamp = now.getTime() + params.durasi_menit * 60 * 1000;
  const endDate = new Date(endTimestamp);
  const waktu_selesai = endDate.toTimeString().slice(0, 5);

  // Generate 6 digit code
  const kode_absensi =
    params.kode_absensi || Math.floor(100000 + Math.random() * 900000).toString();
  const session_id = `SES${Date.now().toString().slice(-6)}`;
  const qr_token = `QR_${session_id}_${kode_absensi}`;

  const newSession: AttendanceSession = {
    session_id,
    schedule_id: params.schedule_id,
    tanggal,
    kode_absensi,
    qr_token,
    waktu_mulai,
    waktu_selesai,
    status: 'OPEN',
    durasi_menit: params.durasi_menit,
    expired_at_timestamp: endTimestamp,
  };

  // Add to localStore
  localStore.sessions.unshift(newSession);

  // Sync to Google Sheets if connected
  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      await gClient.sheets.spreadsheets.values.append({
        spreadsheetId: gClient.spreadsheetId,
        range: 'SESI_ABSENSI!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              session_id,
              params.schedule_id,
              tanggal,
              kode_absensi,
              qr_token,
              waktu_mulai,
              waktu_selesai,
              'OPEN',
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('Could not append session to Google Sheets:', e);
    }
  }

  const all = await getAttendanceSessions();
  return all.find((s) => s.session_id === session_id) || newSession;
}

// 7. CLOSE ATTENDANCE SESSION
export async function closeAttendanceSession(sessionId: string): Promise<boolean> {
  const sess = localStore.sessions.find((s) => s.session_id === sessionId);
  if (sess) {
    sess.status = 'CLOSED';
  }

  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'SESI_ABSENSI!A2:H',
      });
      const rows = response.data.values;
      if (rows) {
        const rowIndex = rows.findIndex((r) => r[0] === sessionId);
        if (rowIndex !== -1) {
          const sheetRowNumber = rowIndex + 2;
          await gClient.sheets.spreadsheets.values.update({
            spreadsheetId: gClient.spreadsheetId,
            range: `SESI_ABSENSI!H${sheetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [['CLOSED']],
            },
          });
        }
      }
    } catch (e) {
      console.warn('Could not update session status in Google Sheets:', e);
    }
  }

  return true;
}

// 8. GET ATTENDANCE RECORDS
export async function getAttendance(filter?: {
  sessionId?: string;
  studentId?: string;
  kelasId?: string;
  tanggal?: string;
}): Promise<AttendanceRecord[]> {
  const gClient = getGoogleSheetsClient();
  let list = localStore.attendance;

  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'ABSENSI!A2:G',
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        list = rows.map((r) => ({
          attendance_id: r[0] || '',
          session_id: r[1] || '',
          student_id: r[2] || '',
          tanggal: r[3] || '',
          waktu_absen: r[4] || '',
          status: (r[5] || 'HADIR') as any,
          keterangan: r[6] || '',
        }));
      }
    } catch (e) {
      console.warn('Google Sheets read error for ABSENSI, using fallback cache:', e);
    }
  }

  const students = await getStudents();
  const schedules = await getSchedules();
  const sessions = localStore.sessions;
  const classes = await getClasses();
  const teachers = await getTeachers();

  const augmented = list.map((record) => {
    const student = students.find((s) => s.student_id === record.student_id);
    const session = sessions.find((sess) => sess.session_id === record.session_id);
    const schedule = session ? schedules.find((sch) => sch.schedule_id === session.schedule_id) : undefined;
    const cls = student ? classes.find((c) => c.kelas_id === student.kelas_id) : undefined;
    const teacher = schedule ? teachers.find((t) => t.guru_id === schedule.guru_id) : undefined;

    return {
      ...record,
      nama_siswa: student ? student.nama : record.student_id,
      nis: student?.nis,
      kelas_id: student?.kelas_id,
      nama_kelas: cls ? cls.nama_kelas : student?.kelas_id,
      mata_pelajaran: schedule ? schedule.mata_pelajaran : 'Mata Pelajaran',
      nama_guru: teacher ? teacher.nama : schedule?.guru_id,
    };
  });

  let result = augmented;
  if (filter?.sessionId) result = result.filter((r) => r.session_id === filter.sessionId);
  if (filter?.studentId) result = result.filter((r) => r.student_id === filter.studentId);
  if (filter?.kelasId) result = result.filter((r) => r.kelas_id === filter.kelasId);
  if (filter?.tanggal) result = result.filter((r) => r.tanggal === filter.tanggal);

  return result;
}

// 9. SUBMIT ATTENDANCE (STUDENT CHECK-IN)
export async function submitAttendance(params: {
  kode_or_token: string;
  student_id: string;
  keterangan?: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: AttendanceRecord;
}> {
  const students = await getStudents();
  const student = students.find((s) => s.student_id === params.student_id);
  if (!student) {
    return { success: false, message: 'Data siswa tidak ditemukan.' };
  }

  const allSessions = await getAttendanceSessions();
  // Match session by 6-digit code or QR token
  const cleanInput = params.kode_or_token.trim().toUpperCase();
  const session = allSessions.find(
    (s) =>
      s.kode_absensi === cleanInput ||
      s.qr_token === cleanInput ||
      cleanInput.includes(s.kode_absensi) ||
      cleanInput.includes(s.session_id)
  );

  if (!session) {
    return { success: false, message: 'Kode absensi atau QR Code salah / tidak ditemukan.' };
  }

  // 1. Check if session is OPEN
  if (session.status !== 'OPEN') {
    return { success: false, message: 'Sesi absensi telah berakhir (CLOSED).' };
  }

  // 2. Check if student is registered in session class
  if (session.kelas_id && student.kelas_id !== session.kelas_id) {
    return {
      success: false,
      message: `Sesi ini khusus untuk kelas ${session.nama_kelas}. Anda terdaftar di kelas lain.`,
    };
  }

  // 3. Check if student already submitted attendance for this session
  const existingRecords = await getAttendance({ sessionId: session.session_id, studentId: student.student_id });
  if (existingRecords.length > 0) {
    return {
      success: false,
      message: 'Anda sudah melakukan absensi untuk sesi ini.',
    };
  }

  // Create new Attendance Record
  const now = new Date();
  const tanggal = now.toISOString().split('T')[0];
  const waktu_absen = now.toTimeString().slice(0, 8); // HH:mm:ss
  const attendance_id = `ATT${Date.now().toString().slice(-6)}`;

  const newRecord: AttendanceRecord = {
    attendance_id,
    session_id: session.session_id,
    student_id: student.student_id,
    tanggal,
    waktu_absen,
    status: 'HADIR',
    keterangan: params.keterangan || 'Absen Mandiri',
    nama_siswa: student.nama,
    nis: student.nis,
    kelas_id: student.kelas_id,
    nama_kelas: session.nama_kelas,
    mata_pelajaran: session.mata_pelajaran,
    nama_guru: session.nama_guru,
  };

  localStore.attendance.unshift(newRecord);

  // Sync to Google Sheets if connected
  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      await gClient.sheets.spreadsheets.values.append({
        spreadsheetId: gClient.spreadsheetId,
        range: 'ABSENSI!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              attendance_id,
              session.session_id,
              student.student_id,
              tanggal,
              waktu_absen,
              'HADIR',
              params.keterangan || 'Absen Mandiri',
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('Could not append attendance to Google Sheets:', e);
    }
  }

  return {
    success: true,
    message: 'Absensi berhasil disimpan ✅',
    data: newRecord,
  };
}

// 10. UPDATE ATTENDANCE (TEACHER MANUAL OVERRIDE)
export async function updateAttendance(
  attendanceId: string,
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA',
  keterangan: string
): Promise<boolean> {
  const record = localStore.attendance.find((a) => a.attendance_id === attendanceId);
  if (record) {
    record.status = status;
    record.keterangan = keterangan;
  }

  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      const response = await gClient.sheets.spreadsheets.values.get({
        spreadsheetId: gClient.spreadsheetId,
        range: 'ABSENSI!A2:G',
      });
      const rows = response.data.values;
      if (rows) {
        const rowIndex = rows.findIndex((r) => r[0] === attendanceId);
        if (rowIndex !== -1) {
          const sheetRowNumber = rowIndex + 2;
          await gClient.sheets.spreadsheets.values.update({
            spreadsheetId: gClient.spreadsheetId,
            range: `ABSENSI!F${sheetRowNumber}:G${sheetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[status, keterangan]],
            },
          });
        }
      }
    } catch (e) {
      console.warn('Could not update attendance row in Google Sheets:', e);
    }
  }

  return true;
}

// 11. GET ATTENDANCE STATISTICS
export async function getAttendanceStatistics(kelasId?: string): Promise<AttendanceStatistics> {
  const students = await getStudents(kelasId);
  const total_siswa = students.length;
  const attendance = await getAttendance(kelasId ? { kelasId } : undefined);
  const classes = await getClasses();

  // Count by status
  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let alfa = 0;

  for (const r of attendance) {
    if (r.status === 'HADIR') hadir++;
    else if (r.status === 'IZIN') izin++;
    else if (r.status === 'SAKIT') sakit++;
    else if (r.status === 'ALFA') alfa++;
  }

  const totalRecords = attendance.length || 1;
  const persentase_kehadiran = Math.round((hadir / totalRecords) * 100);

  const sessions = await getAttendanceSessions();
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.tanggal === today);
  const activeSessions = sessions.filter((s) => s.status === 'OPEN');

  const by_class = classes.map((cls) => {
    const classStudents = students.filter((s) => s.kelas_id === cls.kelas_id);
    const classRecords = attendance.filter((a) => a.kelas_id === cls.kelas_id);
    const cHadir = classRecords.filter((a) => a.status === 'HADIR').length;
    const cIzin = classRecords.filter((a) => a.status === 'IZIN').length;
    const cSakit = classRecords.filter((a) => a.status === 'SAKIT').length;
    const cAlfa = classRecords.filter((a) => a.status === 'ALFA').length;
    const cTotal = classRecords.length || 1;

    return {
      kelas_id: cls.kelas_id,
      nama_kelas: cls.nama_kelas,
      total_siswa: classStudents.length,
      hadir: cHadir,
      izin: cIzin,
      sakit: cSakit,
      alfa: cAlfa,
      persentase: Math.round((cHadir / cTotal) * 100),
    };
  });

  return {
    total_siswa,
    hadir,
    izin,
    sakit,
    alfa,
    persentase_kehadiran,
    total_sesi_hari_ini: todaySessions.length,
    sesi_aktif: activeSessions.length,
    by_class,
  };
}

// 12. ADD NEW STUDENT
export async function addStudent(studentData: Omit<Student, 'student_id'>): Promise<Student> {
  const student_id = `S${(localStore.students.length + 1).toString().padStart(3, '0')}`;
  const newStudent: Student = {
    student_id,
    ...studentData,
    status: studentData.status || 'aktif',
  };
  localStore.students.push(newStudent);

  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      await gClient.sheets.spreadsheets.values.append({
        spreadsheetId: gClient.spreadsheetId,
        range: 'SISWA!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newStudent.student_id,
              newStudent.nis,
              newStudent.nama,
              newStudent.kelas_id,
              newStudent.username,
              newStudent.password_hash || '123456',
              newStudent.status,
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('Could not append new student to Google Sheets:', e);
    }
  }

  return newStudent;
}

// 13. DELETE STUDENT
export async function deleteStudent(studentId: string): Promise<boolean> {
  localStore.students = localStore.students.filter((s) => s.student_id !== studentId);
  return true;
}

// 14. ADD NEW TEACHER
export async function addTeacher(teacherData: {
  nama: string;
  username: string;
  password_hash?: string;
  mata_pelajaran_utama?: string;
  status?: 'aktif' | 'nonaktif';
}): Promise<Teacher> {
  const guru_id = `G${(localStore.teachers.length + 1).toString().padStart(3, '0')}`;
  const newTeacher: Teacher = {
    guru_id,
    nama: teacherData.nama,
    username: teacherData.username || teacherData.nama.toLowerCase().replace(/\s+/g, '_'),
    password_hash: teacherData.password_hash || '123456',
    status: teacherData.status || 'aktif',
    mata_pelajaran_utama: teacherData.mata_pelajaran_utama || 'Umum',
  };
  localStore.teachers.push(newTeacher);

  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      await gClient.sheets.spreadsheets.values.append({
        spreadsheetId: gClient.spreadsheetId,
        range: 'GURU!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newTeacher.guru_id,
              newTeacher.nama,
              newTeacher.username,
              newTeacher.password_hash,
              newTeacher.status,
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('Could not append new teacher to Google Sheets:', e);
    }
  }

  return newTeacher;
}

// 15. DELETE TEACHER
export async function deleteTeacher(guruId: string): Promise<boolean> {
  localStore.teachers = localStore.teachers.filter((t) => t.guru_id !== guruId);
  return true;
}

// 16. ADD NEW CLASS
export async function addClass(classData: {
  nama_kelas: string;
  wali_kelas_id?: string;
  status?: 'aktif' | 'nonaktif';
}): Promise<ClassRoom> {
  const kelas_id = `K${(localStore.classes.length + 1).toString().padStart(3, '0')}`;
  const newClass: ClassRoom = {
    kelas_id,
    nama_kelas: classData.nama_kelas,
    wali_kelas_id: classData.wali_kelas_id || '',
    status: classData.status || 'aktif',
    total_siswa: 0,
  };
  localStore.classes.push(newClass);

  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      await gClient.sheets.spreadsheets.values.append({
        spreadsheetId: gClient.spreadsheetId,
        range: 'KELAS!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newClass.kelas_id,
              newClass.nama_kelas,
              newClass.wali_kelas_id,
              newClass.status,
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('Could not append new class to Google Sheets:', e);
    }
  }

  return newClass;
}

// 17. DELETE CLASS
export async function deleteClass(kelasId: string): Promise<boolean> {
  localStore.classes = localStore.classes.filter((c) => c.kelas_id !== kelasId);
  return true;
}

// 18. ADD NEW SCHEDULE
export async function addSchedule(scheduleData: {
  kelas_id: string;
  guru_id: string;
  mata_pelajaran: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jam_mulai: string;
  jam_selesai: string;
}): Promise<Schedule> {
  const schedule_id = `SCH${(localStore.schedules.length + 1).toString().padStart(3, '0')}`;
  const newSchedule: Schedule = {
    schedule_id,
    kelas_id: scheduleData.kelas_id,
    guru_id: scheduleData.guru_id,
    mata_pelajaran: scheduleData.mata_pelajaran,
    hari: scheduleData.hari,
    jam_mulai: scheduleData.jam_mulai,
    jam_selesai: scheduleData.jam_selesai,
    status: 'aktif',
  };
  localStore.schedules.push(newSchedule);

  const gClient = getGoogleSheetsClient();
  if (gClient) {
    try {
      await gClient.sheets.spreadsheets.values.append({
        spreadsheetId: gClient.spreadsheetId,
        range: 'JADWAL!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newSchedule.schedule_id,
              newSchedule.kelas_id,
              newSchedule.guru_id,
              newSchedule.mata_pelajaran,
              newSchedule.hari,
              newSchedule.jam_mulai,
              newSchedule.jam_selesai,
              'aktif',
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('Could not append new schedule to Google Sheets:', e);
    }
  }

  return newSchedule;
}

// 19. DELETE SCHEDULE
export async function deleteSchedule(scheduleId: string): Promise<boolean> {
  localStore.schedules = localStore.schedules.filter((s) => s.schedule_id !== scheduleId);
  return true;
}

// 20. RESET DATABASE TO ZERO
export function resetDatabaseToZero() {
  localStore.students = [];
  localStore.teachers = [];
  localStore.classes = [];
  localStore.schedules = [];
  localStore.sessions = [];
  localStore.attendance = [];
  return { success: true, message: 'Database telah direset ke 0 (kosong total).' };
}
