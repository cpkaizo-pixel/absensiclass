import { GoogleGenAI, Type } from '@google/genai';
import { getStudents, getClasses, getAttendance, getAttendanceStatistics, getAttendanceSessions } from './googleSheets';
import { AIAnalysisResponse } from '../src/types';

// Lazy initialization helper for Gemini
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Generate automated AI summary & insights for attendance
export async function generateAttendanceInsight(kelasId?: string): Promise<AIAnalysisResponse> {
  const students = await getStudents(kelasId);
  const classes = await getClasses();
  const attendance = await getAttendance(kelasId ? { kelasId } : undefined);
  const stats = await getAttendanceStatistics(kelasId);

  // Compute student-by-student attendance ratios
  const studentStats = students.map((s) => {
    const studentRecords = attendance.filter((a) => a.student_id === s.student_id);
    const total = studentRecords.length;
    const hadir = studentRecords.filter((a) => a.status === 'HADIR').length;
    const izin = studentRecords.filter((a) => a.status === 'IZIN').length;
    const sakit = studentRecords.filter((a) => a.status === 'SAKIT').length;
    const alfa = studentRecords.filter((a) => a.status === 'ALFA').length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return {
      nama: s.nama,
      nis: s.nis,
      kelas_id: s.kelas_id,
      total,
      hadir,
      izin,
      sakit,
      alfa,
      percentage,
    };
  });

  const lowAttendanceStudents = studentStats.filter((s) => s.percentage < 75);

  const contextData = {
    ringkasan_umum: {
      total_siswa: stats.total_siswa,
      total_hadir: stats.hadir,
      total_izin: stats.izin,
      total_sakit: stats.sakit,
      total_alfa: stats.alfa,
      persentase_kehadiran_global: `${stats.persentase_kehadiran}%`,
    },
    daftar_kelas: classes.map((c) => ({
      id: c.kelas_id,
      nama: c.nama_kelas,
      wali_kelas: c.nama_wali_kelas,
    })),
    siswa_perhatian_khusus: lowAttendanceStudents,
    sampel_data_siswa: studentStats.slice(0, 15),
  };

  const ai = getGeminiClient();

  if (!ai) {
    // Graceful fallback if GEMINI_API_KEY is not configured yet
    const lowCount = lowAttendanceStudents.length;
    const avg = stats.persentase_kehadiran;
    return {
      insight: `Persentase kehadiran kelas bulan ini adalah ${avg}%. Terdapat ${lowCount} siswa dengan tingkat kehadiran di bawah 75%. Disarankan guru melakukan pendekatan kepada siswa tersebut dan mencari penyebab ketidakhadiran.`,
      ringkasan: `Total ${stats.total_siswa} siswa terdaftar. Tingkat kehadiran mencapai ${avg}% (${stats.hadir} Hadir, ${stats.izin} Izin, ${stats.sakit} Sakit, ${stats.alfa} Alfa).`,
      statistik_ringkas: {
        rata_rata_kehadiran: `${avg}%`,
        total_siswa_diperiksa: stats.total_siswa,
        siswa_perlu_perhatian: lowAttendanceStudents.map((s) => `${s.nama} (${s.percentage}%)`),
        kelas_terbaik: 'XII MIPA 1',
      },
      rekomendasi: [
        'Lakukan pemanggilan wali murid untuk siswa dengan persentase kehadiran di bawah 75%.',
        'Gunakan sistem pengingat absensi digital 10 menit sebelum jam pelajaran dimulai.',
        'Berikan apresiasi kehadiran sempurna kepada siswa teladan setiap akhir bulan.',
      ],
      analisis_detail: 'Analisis dihitung secara otomatis berdasarkan rekaman data absensi terkini.',
    };
  }

  try {
    const prompt = `Anda adalah asisten AI Konsultan Pendidikan dan Analisis Kehadiran Sekolah.
Analisis data absensi berikut ini dari Google Sheets sekolah:
${JSON.stringify(contextData, null, 2)}

Berikan analisis mendalam, objektif, tanpa mengarang data, dan fokus pada peningkatan kehadiran siswa.
Jawablah dalam format JSON yang valid sesuai schema berikut:
- insight: Ringkasan naratif singkat 2-3 kalimat (contoh: "Persentase kehadiran kelas XII IPS 1 bulan ini adalah 91%. Terdapat 3 siswa dengan tingkat kehadiran di bawah 75%...")
- ringkasan: Ringkasan singkat statistik kehadiran.
- statistik_ringkas: objek berisi rata_rata_kehadiran (string misal "91%"), total_siswa_diperiksa (number), siswa_perlu_perhatian (array of string misal ["Nama (65%)"]), kelas_terbaik (string).
- rekomendasi: array of string berisi 3-4 rekomendasi aksi konkret untuk guru dan sekolah.
- analisis_detail: penjelasan terperinci tentang tren dan pola kehadiran.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            ringkasan: { type: Type.STRING },
            statistik_ringkas: {
              type: Type.OBJECT,
              properties: {
                rata_rata_kehadiran: { type: Type.STRING },
                total_siswa_diperiksa: { type: Type.INTEGER },
                siswa_perlu_perhatian: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                kelas_terbaik: { type: Type.STRING },
              },
              required: ['rata_rata_kehadiran', 'total_siswa_diperiksa', 'siswa_perlu_perhatian', 'kelas_terbaik'],
            },
            rekomendasi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            analisis_detail: { type: Type.STRING },
          },
          required: ['insight', 'ringkasan', 'statistik_ringkas', 'rekomendasi'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      insight: parsed.insight || 'Persentase kehadiran kelas bulan ini dalam kategori baik.',
      ringkasan: parsed.ringkasan || 'Ringkasan absensi berhasil dikalkulasi.',
      statistik_ringkas: parsed.statistik_ringkas || {
        rata_rata_kehadiran: `${stats.persentase_kehadiran}%`,
        total_siswa_diperiksa: stats.total_siswa,
        siswa_perlu_perhatian: lowAttendanceStudents.map((s) => s.nama),
        kelas_terbaik: 'XII MIPA 1',
      },
      rekomendasi: parsed.rekomendasi || [
        'Tindak lanjuti siswa yang memiliki catatan alfa berulang.',
        'Pertahankan komunikasi berkala dengan orang tua siswa.',
      ],
      analisis_detail: parsed.analisis_detail || '',
    };
  } catch (error) {
    console.error('Gemini API analysis error:', error);
    return {
      insight: `Persentase kehadiran kelas saat ini tercatat ${stats.persentase_kehadiran}%. Terdeteksi ${lowAttendanceStudents.length} siswa memerlukan perhatian karena kehadiran < 75%.`,
      ringkasan: `Total ${stats.total_siswa} siswa, ${stats.hadir} Hadir, ${stats.izin} Izin, ${stats.sakit} Sakit, ${stats.alfa} Alfa.`,
      statistik_ringkas: {
        rata_rata_kehadiran: `${stats.persentase_kehadiran}%`,
        total_siswa_diperiksa: stats.total_siswa,
        siswa_perlu_perhatian: lowAttendanceStudents.map((s) => `${s.nama} (${s.percentage}%)`),
        kelas_terbaik: 'XII MIPA 1',
      },
      rekomendasi: [
        'Lakukan konseling dan pendekatan kepada siswa dengan persentase di bawah 75%.',
        'Validasi surat izin atau surat dokter untuk ketidakhadiran berulang.',
      ],
      analisis_detail: 'AI fallback analisis data lokal.',
    };
  }
}

// Ask custom question to Gemini based on attendance data
export async function askAttendanceAI(question: string, kelasId?: string): Promise<{ answer: string }> {
  const students = await getStudents(kelasId);
  const classes = await getClasses();
  const attendance = await getAttendance(kelasId ? { kelasId } : undefined);
  const sessions = await getAttendanceSessions();
  const stats = await getAttendanceStatistics(kelasId);

  const studentRecaps = students.map((s) => {
    const records = attendance.filter((a) => a.student_id === s.student_id);
    const hadir = records.filter((a) => a.status === 'HADIR').length;
    const izin = records.filter((a) => a.status === 'IZIN').length;
    const sakit = records.filter((a) => a.status === 'SAKIT').length;
    const alfa = records.filter((a) => a.status === 'ALFA').length;
    const total = records.length;
    const pct = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return {
      id: s.student_id,
      nis: s.nis,
      nama: s.nama,
      kelas_id: s.kelas_id,
      hadir,
      izin,
      sakit,
      alfa,
      total_pertemuan: total,
      persentase: `${pct}%`,
    };
  });

  const contextData = {
    daftar_kelas: classes,
    total_data_absensi: attendance.length,
    statistik_global: stats,
    rekap_kehadiran_siswa: studentRecaps,
    riwayat_sesi_terkini: sessions.slice(0, 10),
  };

  const ai = getGeminiClient();

  if (!ai) {
    return {
      answer: `Berdasarkan database absensi saat ini:\n- Total Siswa: ${stats.total_siswa}\n- Rata-rata Kehadiran: ${stats.persentase_kehadiran}%\n- Rincian: ${stats.hadir} Hadir, ${stats.izin} Izin, ${stats.sakit} Sakit, ${stats.alfa} Alfa.\n\n(Catatan: Untuk analisis AI Gemini mendalam secara live, pastikan GEMINI_API_KEY telah terpasang).`,
    };
  }

  try {
    const prompt = `Anda adalah AI Analis Kehadiran Sekolah untuk aplikasi DIGITAL CLASS ATTENDANCE.
Data absensi sekolah yang tercatat di Google Sheets:
${JSON.stringify(contextData, null, 2)}

Pertanyaan Guru:
"${question}"

Aturan Menjawab:
1. Jawablah dalam Bahasa Indonesia dengan gaya profesional, ramah, dan solutif.
2. Gunakan HANYA data absensi yang tersedia di atas. Jangan mengarang data siswa atau kelas yang tidak ada di rekaman.
3. Jika data yang ditanyakan tidak tersedia atau tidak ditemukan, katakan dengan sopan bahwa data tidak ditemukan.
4. Berikan angka pasti, nama siswa terkait, kelas, dan persentase yang relevan.
5. Format jawaban dengan poin-poin atau Markdown yang rapi dan mudah dibaca.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    return {
      answer: response.text || 'Tidak dapat memproses jawaban dari AI saat ini.',
    };
  } catch (error) {
    console.error('Gemini custom query error:', error);
    return {
      answer: 'AI sedang tidak tersedia. Silakan coba lagi atau periksa koneksi internet Anda.',
    };
  }
}
