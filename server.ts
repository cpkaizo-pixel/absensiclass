import express, { Request, Response } from 'express';
import path from 'path';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import {
  getStudents,
  getTeachers,
  getClasses,
  getSchedules,
  getAttendanceSessions,
  createAttendanceSession,
  closeAttendanceSession,
  getAttendance,
  submitAttendance,
  updateAttendance,
  getAttendanceStatistics,
  addStudent,
  deleteStudent,
  addTeacher,
  deleteTeacher,
  addClass,
  deleteClass,
  addSchedule,
  deleteSchedule,
  resetDatabaseToZero,
  getSheetsConnectionStatus,
} from './server/googleSheets';
import { generateAttendanceInsight, askAttendanceAI } from './server/gemini';
import { DEFAULT_ADMIN_ACCOUNT } from './src/data/demoData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. HEALTH CHECK & GOOGLE SHEETS STATUS
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', app: 'DIGITAL CLASS ATTENDANCE' });
  });

  app.get('/api/sheets/status', (req: Request, res: Response) => {
    const status = getSheetsConnectionStatus();
    res.json({ success: true, data: status });
  });

  // 2. AUTHENTICATION (ADMIN, GURU, SISWA)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password, role } = req.body;
      if (!username) {
        return res.status(400).json({ success: false, message: 'Username wajib diisi' });
      }

      const cleanUser = username.toLowerCase().trim();

      // Check ADMIN first
      if (role === 'ADMIN' || cleanUser === 'admin') {
        if (cleanUser === 'admin') {
          return res.json({
            success: true,
            message: 'Selamat datang, Administrator Sistem',
            data: {
              id: DEFAULT_ADMIN_ACCOUNT.id,
              username: DEFAULT_ADMIN_ACCOUNT.username,
              nama: DEFAULT_ADMIN_ACCOUNT.nama,
              role: 'ADMIN',
            },
          });
        }
        return res.status(401).json({ success: false, message: 'Akun Administrator tidak ditemukan.' });
      }

      if (role === 'GURU') {
        const teachers = await getTeachers();
        const teacher = teachers.find(
          (t) => t.username.toLowerCase() === cleanUser
        );
        if (teacher) {
          return res.json({
            success: true,
            message: `Selamat datang, ${teacher.nama}`,
            data: {
              id: teacher.guru_id,
              guru_id: teacher.guru_id,
              username: teacher.username,
              nama: teacher.nama,
              role: 'GURU',
            },
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Akun Guru tidak ditemukan. Silakan login sebagai Admin untuk mendaftarkan Guru.',
        });
      } else {
        // SISWA login
        const students = await getStudents();
        const classes = await getClasses();
        const student = students.find(
          (s) =>
            s.username.toLowerCase() === cleanUser ||
            s.nis === username.trim()
        );
        if (student) {
          const cls = classes.find((c) => c.kelas_id === student.kelas_id);
          return res.json({
            success: true,
            message: `Selamat datang, ${student.nama}`,
            data: {
              id: student.student_id,
              student_id: student.student_id,
              nis: student.nis,
              username: student.username,
              nama: student.nama,
              kelas_id: student.kelas_id,
              nama_kelas: cls ? cls.nama_kelas : student.kelas_id,
              role: 'SISWA',
            },
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Akun Siswa atau NIS tidak ditemukan. Silakan hubungi Guru / Admin untuk mendaftar.',
        });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat login.' });
    }
  });

  // 3. STUDENTS API
  app.get('/api/students', async (req: Request, res: Response) => {
    try {
      const kelasId = req.query.kelas_id as string;
      const students = await getStudents(kelasId);
      const classes = await getClasses();
      const augmented = students.map((s) => {
        const cls = classes.find((c) => c.kelas_id === s.kelas_id);
        return { ...s, nama_kelas: cls?.nama_kelas || s.kelas_id };
      });
      res.json({ success: true, message: 'Berhasil memuat data siswa', data: augmented });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat data siswa' });
    }
  });

  app.post('/api/students', async (req: Request, res: Response) => {
    try {
      const { nis, nama, kelas_id, username, password_hash, status } = req.body;
      if (!nis || !nama || !kelas_id) {
        return res.status(400).json({ success: false, message: 'NIS, Nama, dan Kelas wajib diisi' });
      }
      const newStudent = await addStudent({
        nis,
        nama,
        kelas_id,
        username: username || nama.toLowerCase().replace(/\s+/g, '_'),
        password_hash: password_hash || '123456',
        status: status || 'aktif',
      });
      res.json({ success: true, message: 'Siswa berhasil ditambahkan', data: newStudent });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menambahkan siswa' });
    }
  });

  app.delete('/api/students/:id', async (req: Request, res: Response) => {
    try {
      await deleteStudent(req.params.id);
      res.json({ success: true, message: 'Siswa berhasil dihapus' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menghapus siswa' });
    }
  });

  // 4. TEACHERS & CLASSES & SCHEDULES API
  app.get('/api/teachers', async (req: Request, res: Response) => {
    try {
      const teachers = await getTeachers();
      res.json({ success: true, message: 'Berhasil memuat data guru', data: teachers });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat data guru' });
    }
  });

  app.post('/api/teachers', async (req: Request, res: Response) => {
    try {
      const { nama, username, password_hash, mata_pelajaran_utama, status } = req.body;
      if (!nama) {
        return res.status(400).json({ success: false, message: 'Nama guru wajib diisi' });
      }
      const newTeacher = await addTeacher({
        nama,
        username: username || nama.toLowerCase().replace(/\s+/g, '_'),
        password_hash: password_hash || '123456',
        mata_pelajaran_utama: mata_pelajaran_utama || 'Umum',
        status: status || 'aktif',
      });
      res.json({ success: true, message: 'Guru berhasil ditambahkan', data: newTeacher });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menambahkan guru' });
    }
  });

  app.delete('/api/teachers/:id', async (req: Request, res: Response) => {
    try {
      await deleteTeacher(req.params.id);
      res.json({ success: true, message: 'Guru berhasil dihapus' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menghapus guru' });
    }
  });

  app.get('/api/classes', async (req: Request, res: Response) => {
    try {
      const classes = await getClasses();
      const students = await getStudents();
      const teachers = await getTeachers();

      const augmented = classes.map((c) => {
        const classStudents = students.filter((s) => s.kelas_id === c.kelas_id);
        const wali = teachers.find((t) => t.guru_id === c.wali_kelas_id);
        return {
          ...c,
          total_siswa: classStudents.length,
          nama_wali_kelas: wali ? wali.nama : 'Belum ditentukan',
        };
      });
      res.json({ success: true, message: 'Berhasil memuat data kelas', data: augmented });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat data kelas' });
    }
  });

  app.post('/api/classes', async (req: Request, res: Response) => {
    try {
      const { nama_kelas, wali_kelas_id, status } = req.body;
      if (!nama_kelas) {
        return res.status(400).json({ success: false, message: 'Nama kelas wajib diisi' });
      }
      const newClass = await addClass({
        nama_kelas,
        wali_kelas_id,
        status: status || 'aktif',
      });
      res.json({ success: true, message: 'Kelas berhasil ditambahkan', data: newClass });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menambahkan kelas' });
    }
  });

  app.delete('/api/classes/:id', async (req: Request, res: Response) => {
    try {
      await deleteClass(req.params.id);
      res.json({ success: true, message: 'Kelas berhasil dihapus' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menghapus kelas' });
    }
  });

  app.get('/api/schedules', async (req: Request, res: Response) => {
    try {
      const kelasId = req.query.kelas_id as string;
      const guruId = req.query.guru_id as string;
      const schedules = await getSchedules(kelasId, guruId);
      res.json({ success: true, message: 'Berhasil memuat jadwal', data: schedules });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat jadwal' });
    }
  });

  app.post('/api/schedules', async (req: Request, res: Response) => {
    try {
      const { kelas_id, guru_id, mata_pelajaran, hari, jam_mulai, jam_selesai } = req.body;
      if (!kelas_id || !guru_id || !mata_pelajaran || !hari || !jam_mulai || !jam_selesai) {
        return res.status(400).json({ success: false, message: 'Semua bidang jadwal wajib diisi' });
      }
      const newSchedule = await addSchedule({
        kelas_id,
        guru_id,
        mata_pelajaran,
        hari,
        jam_mulai,
        jam_selesai,
      });
      res.json({ success: true, message: 'Jadwal berhasil ditambahkan', data: newSchedule });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menambahkan jadwal' });
    }
  });

  app.delete('/api/schedules/:id', async (req: Request, res: Response) => {
    try {
      await deleteSchedule(req.params.id);
      res.json({ success: true, message: 'Jadwal berhasil dihapus' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menghapus jadwal' });
    }
  });

  // System Database Reset Endpoint
  app.post('/api/system/reset', (req: Request, res: Response) => {
    const result = resetDatabaseToZero();
    res.json(result);
  });

  // 5. ATTENDANCE SESSION MANAGEMENT
  app.post('/api/attendance/session', async (req: Request, res: Response) => {
    try {
      const { schedule_id, durasi_menit, tanggal } = req.body;
      if (!schedule_id) {
        return res.status(400).json({ success: false, message: 'Jadwal wajib dipilih' });
      }
      const durasi = Number(durasi_menit) || 15;
      const session = await createAttendanceSession({
        schedule_id,
        durasi_menit: durasi,
        tanggal,
      });

      // Generate QR Code data URL
      const qrDataUrl = await QRCode.toDataURL(session.qr_token, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      res.json({
        success: true,
        message: 'Sesi absensi berhasil dibuka!',
        data: {
          ...session,
          qr_code_image: qrDataUrl,
        },
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal membuka sesi absensi' });
    }
  });

  app.post('/api/attendance/session/close', async (req: Request, res: Response) => {
    try {
      const { session_id } = req.body;
      if (!session_id) {
        return res.status(400).json({ success: false, message: 'session_id wajib diisi' });
      }
      await closeAttendanceSession(session_id);
      res.json({ success: true, message: 'Sesi absensi berhasil ditutup' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal menutup sesi absensi' });
    }
  });

  app.get('/api/attendance/session/active', async (req: Request, res: Response) => {
    try {
      const kelasId = req.query.kelas_id as string;
      const openSessions = await getAttendanceSessions('OPEN');
      let activeSession = openSessions[0] || null;

      if (kelasId && openSessions.length > 0) {
        const match = openSessions.find((s) => s.kelas_id === kelasId);
        if (match) activeSession = match;
      }

      if (activeSession) {
        const qrDataUrl = await QRCode.toDataURL(activeSession.qr_token, {
          width: 300,
          margin: 2,
        });
        return res.json({
          success: true,
          message: 'Sesi absensi aktif ditemukan',
          data: {
            ...activeSession,
            qr_code_image: qrDataUrl,
          },
        });
      }

      res.json({ success: true, message: 'Tidak ada sesi absensi aktif saat ini', data: null });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat sesi aktif' });
    }
  });

  app.get('/api/attendance/session/all', async (req: Request, res: Response) => {
    try {
      const sessions = await getAttendanceSessions();
      res.json({ success: true, message: 'Berhasil memuat riwayat sesi', data: sessions });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat riwayat sesi' });
    }
  });

  // 6. STUDENT ATTENDANCE SUBMISSION
  app.post('/api/attendance/submit', async (req: Request, res: Response) => {
    try {
      const { kode_absensi, student_id, keterangan } = req.body;
      if (!kode_absensi || !student_id) {
        return res.status(400).json({
          success: false,
          message: 'Kode absensi dan Identitas Siswa wajib disertakan.',
        });
      }

      const result = await submitAttendance({
        kode_or_token: kode_absensi,
        student_id,
        keterangan,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: 'Database sedang tidak dapat diakses. Silakan coba lagi.',
      });
    }
  });

  // 7. ATTENDANCE HISTORY & MANUAL STATUS UPDATE
  app.get('/api/attendance/history', async (req: Request, res: Response) => {
    try {
      const { session_id, student_id, kelas_id, tanggal } = req.query;
      const history = await getAttendance({
        sessionId: session_id as string,
        studentId: student_id as string,
        kelasId: kelas_id as string,
        tanggal: tanggal as string,
      });
      res.json({ success: true, message: 'Berhasil memuat data absensi', data: history });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat data absensi' });
    }
  });

  app.post('/api/attendance/update-status', async (req: Request, res: Response) => {
    try {
      const { attendance_id, status, keterangan } = req.body;
      if (!attendance_id || !status) {
        return res.status(400).json({ success: false, message: 'attendance_id dan status wajib diisi' });
      }
      await updateAttendance(attendance_id, status, keterangan || '');
      res.json({ success: true, message: 'Status absensi berhasil diperbarui' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memperbarui status absensi' });
    }
  });

  // 8. ATTENDANCE STATISTICS
  app.get('/api/attendance/statistics', async (req: Request, res: Response) => {
    try {
      const kelasId = req.query.kelas_id as string;
      const stats = await getAttendanceStatistics(kelasId);
      res.json({ success: true, message: 'Berhasil memuat statistik', data: stats });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Gagal memuat statistik' });
    }
  });

  // 9. AI GEMINI ANALYTICS
  app.post('/api/ai/analyze-attendance', async (req: Request, res: Response) => {
    try {
      const { kelas_id } = req.body;
      const analysis = await generateAttendanceInsight(kelas_id);
      res.json({ success: true, message: 'Analisis AI selesai', data: analysis });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: 'AI sedang tidak tersedia. Silakan coba lagi.',
      });
    }
  });

  app.post('/api/ai/ask-attendance', async (req: Request, res: Response) => {
    try {
      const { question, kelas_id } = req.body;
      if (!question) {
        return res.status(400).json({ success: false, message: 'Pertanyaan wajib diisi' });
      }
      const result = await askAttendanceAI(question, kelas_id);
      res.json({ success: true, message: 'Pertanyaan dijawab oleh AI', data: result });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: 'AI sedang tidak tersedia. Silakan coba lagi.',
      });
    }
  });

  // 10. VITE SPA MIDDLEWARE / PRODUCTION STATIC FILES
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DIGITAL CLASS ATTENDANCE server running on http://localhost:${PORT}`);
  });
}

startServer();
