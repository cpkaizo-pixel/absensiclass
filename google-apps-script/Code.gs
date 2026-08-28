/**
 * ============================================================================
 * DIGITAL CLASS ATTENDANCE - GOOGLE APPS SCRIPT (Code.gs)
 * Backend & Database Management Script for Google Sheets
 * ============================================================================
 * 
 * CARA MENGGUNAKAN:
 * 1. Buka Google Spreadsheet baru di https://sheets.new
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script"
 * 3. Hapus semua kode yang ada di editor, lalu PASTE seluruh kode ini ke file Code.gs
 * 4. Klik icon "Simpan" (Save Project - Ctrl+S / Cmd+S)
 * 5. Pilih fungsi 'setupSpreadsheet' di dropdown atas, lalu klik "Jalankan" (Run)
 * 6. Berikan izin otorisasi Google saat pertama kali dijalankan (Review Permissions > Allow)
 * 7. Untuk deploy sebagai Web API:
 *    - Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment)
 *    - Pilih jenis: "Aplikasi Web" (Web app)
 *    - Deskripsi: "Digital Class Attendance API v1.0"
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Yang memiliki akses: "Siapa saja" (Anyone) -> SANGAT PENTING
 *    - Klik "Terapkan" (Deploy) lalu Salin "URL Aplikasi Web"
 * ============================================================================
 */

// NAMA SHEET / TAB
var SHEETS = {
  SISWA: 'SISWA',
  GURU: 'GURU',
  KELAS: 'KELAS',
  JADWAL: 'JADWAL',
  SESI_ABSENSI: 'SESI_ABSENSI',
  ABSENSI: 'ABSENSI',
  SETTINGS: 'SETTINGS'
};

/**
 * 1. MENU OTOMATIS DI GOOGLE SHEETS
 * Muncul setiap kali spreadsheet dibuka
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏫 Absensi Digital')
    .addItem('🚀 1. Inisialisasi Seluruh Tab Spreadsheet', 'setupSpreadsheet')
    .addItem('📊 2. Buat Lembar Rekap Kehadiran Otomatis', 'generateAttendanceSummarySheet')
    .addItem('🧹 3. Bersihkan Sesi Kadaluarsa', 'cleanExpiredSessions')
    .addSeparator()
    .addItem('ℹ️ 4. Info & Status Web App', 'showSystemInfo')
    .addToUi();
}

/**
 * 2. SETUP SPREADSHEET
 * Membuat 6 sheet utama dengan header berwarna, freeze pane, & data validasi
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Tab KELAS
  var sheetKelas = getOrCreateSheet(ss, SHEETS.KELAS);
  setupHeaders(sheetKelas, ['kelas_id', 'nama_kelas', 'wali_kelas_id', 'status'], '#2563eb');

  // Tab GURU
  var sheetGuru = getOrCreateSheet(ss, SHEETS.GURU);
  setupHeaders(sheetGuru, ['guru_id', 'nip', 'nama', 'mata_pelajaran', 'username', 'password_hash', 'status'], '#7c3aed');

  // Tab SISWA
  var sheetSiswa = getOrCreateSheet(ss, SHEETS.SISWA);
  setupHeaders(sheetSiswa, ['student_id', 'nis', 'nama', 'kelas_id', 'username', 'password_hash', 'status'], '#059669');

  // Tab JADWAL
  var sheetJadwal = getOrCreateSheet(ss, SHEETS.JADWAL);
  setupHeaders(sheetJadwal, ['schedule_id', 'kelas_id', 'guru_id', 'mata_pelajaran', 'hari', 'jam_mulai', 'jam_selesai'], '#4f46e5');

  // Tab SESI_ABSENSI
  var sheetSesi = getOrCreateSheet(ss, SHEETS.SESI_ABSENSI);
  setupHeaders(sheetSesi, ['session_id', 'schedule_id', 'tanggal', 'waktu_mulai', 'waktu_selesai', 'kode_absensi', 'qr_token', 'status'], '#d97706');

  // Tab ABSENSI
  var sheetAbsensi = getOrCreateSheet(ss, SHEETS.ABSENSI);
  setupHeaders(sheetAbsensi, ['attendance_id', 'session_id', 'student_id', 'tanggal', 'waktu_absen', 'status', 'keterangan'], '#0d9488');

  // Tab SETTINGS
  var sheetSettings = getOrCreateSheet(ss, SHEETS.SETTINGS);
  setupHeaders(sheetSettings, ['key', 'value', 'keterangan'], '#475569');
  
  if (sheetSettings.getLastRow() <= 1) {
    sheetSettings.appendRow(['APP_NAME', 'Digital Class Attendance', 'Nama Aplikasi']);
    sheetSettings.appendRow(['VERSION', '1.0.0', 'Versi API Backend']);
    sheetSettings.appendRow(['LAST_INITIALIZED', new Date().toISOString(), 'Waktu Setup Awal']);
  }

  // Terapkan validasi status dropdown
  applyStatusValidation(sheetAbsensi, 6, ['HADIR', 'IZIN', 'SAKIT', 'ALFA']);
  applyStatusValidation(sheetSiswa, 7, ['aktif', 'nonaktif']);
  applyStatusValidation(sheetSesi, 8, ['OPEN', 'CLOSED']);

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast('Seluruh tab spreadsheet berhasil diinisialisasi!', 'Sukses', 5);
  return { success: true, message: 'Spreadsheet berhasil diinisialisasi' };
}

/**
 * Helper: Ambil atau buat sheet jika belum ada
 */
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Helper: Format Header Row (Font Putih, Tebal, Background Warna, Freeze Row 1)
 */
function setupHeaders(sheet, headers, bgHexColor) {
  sheet.setFrozenRows(1);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    // Perbarui header baris 1
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground(bgHexColor)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);

  // Auto resize columns
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
    if (sheet.getColumnWidth(i) < 110) {
      sheet.setColumnWidth(i, 130);
    }
  }
}

/**
 * Helper: Terapkan dropdown data validation
 */
function applyStatusValidation(sheet, columnIndex, allowedValues) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(allowedValues, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, columnIndex, 500, 1).setDataValidation(rule);
}

/**
 * 3. WEB APP ENTRYPOINTS (GET & POST)
 * Mengizinkan Frontend React / Vercel berkomunikasi langsung via REST JSON
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  var response = { success: false, message: 'Invalid request' };
  try {
    var params = (e && e.parameter) || {};
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = {};
      }
    }
    
    // Gabungkan params
    var payload = Object.assign({}, params, postData);
    var action = payload.action || params.action || 'ping';

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case 'ping':
      case 'status':
        response = {
          success: true,
          message: 'Digital Class Attendance Google Apps Script API is online',
          spreadsheetName: ss.getName(),
          spreadsheetId: ss.getId(),
          timestamp: new Date().toISOString()
        };
        break;

      case 'setup':
      case 'init':
        response = setupSpreadsheet();
        break;

      // --- SISWA CRUD ---
      case 'getStudents':
        response = { success: true, data: getSheetData(ss, SHEETS.SISWA) };
        break;

      case 'addStudent':
        response = addStudentRecord(ss, payload);
        break;

      case 'deleteStudent':
        response = deleteRowByColumn(ss, SHEETS.SISWA, 'student_id', payload.student_id);
        break;

      // --- GURU CRUD ---
      case 'getTeachers':
        response = { success: true, data: getSheetData(ss, SHEETS.GURU) };
        break;

      case 'addTeacher':
        response = addTeacherRecord(ss, payload);
        break;

      case 'deleteTeacher':
        response = deleteRowByColumn(ss, SHEETS.GURU, 'guru_id', payload.guru_id);
        break;

      // --- KELAS CRUD ---
      case 'getClasses':
        response = { success: true, data: getSheetData(ss, SHEETS.KELAS) };
        break;

      case 'addClass':
        response = addClassRecord(ss, payload);
        break;

      case 'deleteClass':
        response = deleteRowByColumn(ss, SHEETS.KELAS, 'kelas_id', payload.kelas_id);
        break;

      // --- JADWAL CRUD ---
      case 'getSchedules':
        response = { success: true, data: getSheetData(ss, SHEETS.JADWAL) };
        break;

      case 'addSchedule':
        response = addScheduleRecord(ss, payload);
        break;

      case 'deleteSchedule':
        response = deleteRowByColumn(ss, SHEETS.JADWAL, 'schedule_id', payload.schedule_id);
        break;

      // --- SESI ABSENSI ---
      case 'getSessions':
        response = { success: true, data: getSheetData(ss, SHEETS.SESI_ABSENSI) };
        break;

      case 'getActiveSession':
        response = getActiveSessionData(ss, payload.kelas_id);
        break;

      case 'createSession':
        response = createAttendanceSessionGS(ss, payload);
        break;

      case 'closeSession':
        response = closeAttendanceSessionGS(ss, payload.session_id);
        break;

      // --- SUBMIT ABSENSI SISWA ---
      case 'submitAttendance':
        response = submitStudentAttendanceGS(ss, payload);
        break;

      // --- REKAP & RIWAYAT ABSENSI ---
      case 'getAttendance':
      case 'getAttendanceHistory':
        response = { success: true, data: getAttendanceRecordsGS(ss, payload) };
        break;

      case 'updateAttendanceStatus':
        response = updateAttendanceStatusGS(ss, payload);
        break;

      case 'getStatistics':
        response = { success: true, data: calculateStatisticsGS(ss, payload.kelas_id) };
        break;

      default:
        response = { success: false, message: 'Action tidak dikenal: ' + action };
    }
  } catch (error) {
    response = { success: false, message: error.toString(), stack: error.stack };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 4. HELPER DATA ENGINE (SHEET TO JSON & JSON TO SHEET)
 */
function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var item = {};
    for (var h = 0; h < headers.length; h++) {
      var key = headers[h];
      var val = row[h];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      }
      item[key] = val;
    }
    result.push(item);
  }
  return result;
}

function deleteRowByColumn(ss, sheetName, columnName, targetValue) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet tidak ditemukan' };
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: 'Data kosong' };

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colIndex = headers.indexOf(columnName) + 1;
  if (colIndex === 0) return { success: false, message: 'Kolom ID tidak ditemukan' };

  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0]) === String(targetValue)) {
      sheet.deleteRow(i + 2);
      return { success: true, message: 'Data berhasil dihapus' };
    }
  }
  return { success: false, message: 'Data tidak ditemukan untuk dihapus' };
}

// --- CRUD IMPLEMENTATIONS ---

function addStudentRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.SISWA);
  var id = data.student_id || ('std_' + Utilities.getUuid().slice(0, 8));
  var row = [
    id,
    data.nis || '',
    data.nama || '',
    data.kelas_id || '',
    data.username || (data.nama ? data.nama.toLowerCase().replace(/\s+/g, '_') : id),
    data.password_hash || '123456',
    data.status || 'aktif'
  ];
  sheet.appendRow(row);
  return { success: true, message: 'Siswa berhasil disimpan', data: { student_id: id, nama: data.nama, nis: data.nis } };
}

function addTeacherRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.GURU);
  var id = data.guru_id || ('gru_' + Utilities.getUuid().slice(0, 8));
  var row = [
    id,
    data.nip || '',
    data.nama || '',
    data.mata_pelajaran || data.mata_pelajaran_utama || 'Umum',
    data.username || (data.nama ? data.nama.toLowerCase().replace(/\s+/g, '_') : id),
    data.password_hash || '123456',
    data.status || 'aktif'
  ];
  sheet.appendRow(row);
  return { success: true, message: 'Guru berhasil disimpan', data: { guru_id: id, nama: data.nama } };
}

function addClassRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.KELAS);
  var id = data.kelas_id || ('cls_' + Utilities.getUuid().slice(0, 8));
  var row = [
    id,
    data.nama_kelas || '',
    data.wali_kelas_id || '',
    data.status || 'aktif'
  ];
  sheet.appendRow(row);
  return { success: true, message: 'Kelas berhasil disimpan', data: { kelas_id: id, nama_kelas: data.nama_kelas } };
}

function addScheduleRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.JADWAL);
  var id = data.schedule_id || ('sch_' + Utilities.getUuid().slice(0, 8));
  var row = [
    id,
    data.kelas_id || '',
    data.guru_id || '',
    data.mata_pelajaran || '',
    data.hari || 'Senin',
    data.jam_mulai || '07:30',
    data.jam_selesai || '09:00'
  ];
  sheet.appendRow(row);
  return { success: true, message: 'Jadwal berhasil disimpan', data: { schedule_id: id } };
}

function createAttendanceSessionGS(ss, data) {
  var sheetSesi = getOrCreateSheet(ss, SHEETS.SESI_ABSENSI);
  var sessionId = 'ses_' + Utilities.getUuid().slice(0, 8);
  var now = new Date();
  var duration = Number(data.durasi_menit) || 15;
  var endTime = new Date(now.getTime() + duration * 60000);

  // Generate 6 digit pin
  var pin = String(Math.floor(100000 + Math.random() * 900000));
  var qrToken = 'dca_' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  var dateStr = data.tanggal || Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var startTimeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
  var endTimeStr = Utilities.formatDate(endTime, Session.getScriptTimeZone(), 'HH:mm');

  // Tutup sesi open sebelumnya untuk jadwal yang sama
  var sessions = getSheetData(ss, SHEETS.SESI_ABSENSI);
  var lastRow = sheetSesi.getLastRow();
  if (lastRow > 1) {
    var headers = sheetSesi.getRange(1, 1, 1, sheetSesi.getLastColumn()).getValues()[0];
    var statusCol = headers.indexOf('status') + 1;
    var schedCol = headers.indexOf('schedule_id') + 1;
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].status === 'OPEN' && (!data.schedule_id || sessions[i].schedule_id === data.schedule_id)) {
        sheetSesi.getRange(i + 2, statusCol).setValue('CLOSED');
      }
    }
  }

  var row = [
    sessionId,
    data.schedule_id || '',
    dateStr,
    startTimeStr,
    endTimeStr,
    pin,
    qrToken,
    'OPEN'
  ];
  sheetSesi.appendRow(row);

  return {
    success: true,
    message: 'Sesi absensi berhasil dibuka',
    data: {
      session_id: sessionId,
      schedule_id: data.schedule_id,
      tanggal: dateStr,
      waktu_mulai: startTimeStr,
      waktu_selesai: endTimeStr,
      kode_absensi: pin,
      qr_token: qrToken,
      status: 'OPEN'
    }
  };
}

function closeAttendanceSessionGS(ss, sessionId) {
  var sheetSesi = getOrCreateSheet(ss, SHEETS.SESI_ABSENSI);
  var lastRow = sheetSesi.getLastRow();
  if (lastRow <= 1) return { success: false, message: 'Tidak ada sesi' };

  var headers = sheetSesi.getRange(1, 1, 1, sheetSesi.getLastColumn()).getValues()[0];
  var idCol = headers.indexOf('session_id') + 1;
  var statusCol = headers.indexOf('status') + 1;

  var ids = sheetSesi.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(sessionId) || !sessionId) {
      sheetSesi.getRange(i + 2, statusCol).setValue('CLOSED');
      return { success: true, message: 'Sesi absensi berhasil ditutup' };
    }
  }
  return { success: false, message: 'Sesi tidak ditemukan' };
}

function getActiveSessionData(ss, kelasId) {
  var sessions = getSheetData(ss, SHEETS.SESI_ABSENSI);
  var schedules = getSheetData(ss, SHEETS.JADWAL);
  var classes = getSheetData(ss, SHEETS.KELAS);
  var teachers = getSheetData(ss, SHEETS.GURU);

  var openSessions = sessions.filter(function(s) { return s.status === 'OPEN'; });
  if (openSessions.length === 0) {
    return { success: true, message: 'Tidak ada sesi aktif', data: null };
  }

  var active = openSessions[0];
  var sch = schedules.find(function(sc) { return sc.schedule_id === active.schedule_id; });
  var cls = sch ? classes.find(function(c) { return c.kelas_id === sch.kelas_id; }) : null;
  var tch = sch ? teachers.find(function(t) { return t.guru_id === sch.guru_id; }) : null;

  var enriched = Object.assign({}, active, {
    mata_pelajaran: sch ? sch.mata_pelajaran : '',
    kelas_id: sch ? sch.kelas_id : '',
    nama_kelas: cls ? cls.nama_kelas : '',
    guru_id: sch ? sch.guru_id : '',
    nama_guru: tch ? tch.nama : ''
  });

  return { success: true, data: enriched };
}

function submitStudentAttendanceGS(ss, data) {
  var codeOrToken = String(data.kode_absensi || data.kode_or_token || '').trim();
  var studentId = String(data.student_id || '').trim();
  var keterangan = data.keterangan || 'Hadir via QR / Kode 6-Digit';

  if (!codeOrToken || !studentId) {
    return { success: false, message: 'Kode absensi dan Student ID wajib diisi' };
  }

  var sessions = getSheetData(ss, SHEETS.SESI_ABSENSI);
  var openSession = sessions.find(function(s) {
    return s.status === 'OPEN' && (s.kode_absensi === codeOrToken || s.qr_token === codeOrToken);
  });

  if (!openSession) {
    return { success: false, message: 'Kode atau QR Code tidak valid atau sesi telah ditutup.' };
  }

  // Cek apakah siswa sudah absen di sesi ini
  var attendances = getSheetData(ss, SHEETS.ABSENSI);
  var existing = attendances.find(function(a) {
    return a.session_id === openSession.session_id && a.student_id === studentId;
  });

  if (existing) {
    return { success: false, message: 'Anda sudah tercatat melakukan absensi pada sesi ini.' };
  }

  var now = new Date();
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
  var attId = 'att_' + Utilities.getUuid().slice(0, 8);

  var sheetAbs = getOrCreateSheet(ss, SHEETS.ABSENSI);
  sheetAbs.appendRow([
    attId,
    openSession.session_id,
    studentId,
    dateStr,
    timeStr,
    'HADIR',
    keterangan
  ]);

  return {
    success: true,
    message: 'Absensi berhasil dicatat!',
    data: {
      attendance_id: attId,
      session_id: openSession.session_id,
      student_id: studentId,
      waktu_absen: timeStr,
      status: 'HADIR'
    }
  };
}

function getAttendanceRecordsGS(ss, filter) {
  var attendances = getSheetData(ss, SHEETS.ABSENSI);
  var students = getSheetData(ss, SHEETS.SISWA);
  var classes = getSheetData(ss, SHEETS.KELAS);
  var sessions = getSheetData(ss, SHEETS.SESI_ABSENSI);
  var schedules = getSheetData(ss, SHEETS.JADWAL);

  var result = attendances.map(function(att) {
    var std = students.find(function(s) { return s.student_id === att.student_id; });
    var ses = sessions.find(function(s) { return s.session_id === att.session_id; });
    var sch = ses ? schedules.find(function(sc) { return sc.schedule_id === ses.schedule_id; }) : null;
    var cls = std ? classes.find(function(c) { return c.kelas_id === std.kelas_id; }) : null;

    return {
      attendance_id: att.attendance_id,
      session_id: att.session_id,
      student_id: att.student_id,
      nama_siswa: std ? std.nama : 'Siswa ' + att.student_id,
      nis: std ? std.nis : '',
      kelas_id: std ? std.kelas_id : '',
      nama_kelas: cls ? cls.nama_kelas : '',
      mata_pelajaran: sch ? sch.mata_pelajaran : 'Pelajaran',
      tanggal: att.tanggal,
      waktu_absen: att.waktu_absen,
      status: att.status || 'HADIR',
      keterangan: att.keterangan || ''
    };
  });

  return result.reverse();
}

function updateAttendanceStatusGS(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.ABSENSI);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, message: 'Data absensi kosong' };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idCol = headers.indexOf('attendance_id') + 1;
  var statusCol = headers.indexOf('status') + 1;
  var ketCol = headers.indexOf('keterangan') + 1;

  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(data.attendance_id)) {
      sheet.getRange(i + 2, statusCol).setValue(data.status);
      if (data.keterangan !== undefined && ketCol > 0) {
        sheet.getRange(i + 2, ketCol).setValue(data.keterangan);
      }
      return { success: true, message: 'Status absensi berhasil diperbarui' };
    }
  }
  return { success: false, message: 'Data absensi tidak ditemukan' };
}

function calculateStatisticsGS(ss, kelasId) {
  var students = getSheetData(ss, SHEETS.SISWA);
  var attendances = getSheetData(ss, SHEETS.ABSENSI);
  var classes = getSheetData(ss, SHEETS.KELAS);

  var targetStudents = kelasId ? students.filter(function(s) { return s.kelas_id === kelasId; }) : students;
  var totalSiswa = targetStudents.length;

  var hadir = 0, izin = 0, sakit = 0, alfa = 0;
  attendances.forEach(function(a) {
    var std = students.find(function(s) { return s.student_id === a.student_id; });
    if (!kelasId || (std && std.kelas_id === kelasId)) {
      var st = (a.status || '').toUpperCase();
      if (st === 'HADIR') hadir++;
      else if (st === 'IZIN') izin++;
      else if (st === 'SAKIT') sakit++;
      else if (st === 'ALFA') alfa++;
    }
  });

  var totalPresensi = hadir + izin + sakit + alfa;
  var persentase = totalPresensi > 0 ? Math.round((hadir / totalPresensi) * 100) : 0;

  var byClass = classes.map(function(c) {
    var cStudents = students.filter(function(s) { return s.kelas_id === c.kelas_id; });
    var cHadir = 0, cIzin = 0, cSakit = 0, cAlfa = 0;
    attendances.forEach(function(a) {
      var s = students.find(function(st) { return st.student_id === a.student_id; });
      if (s && s.kelas_id === c.kelas_id) {
        var status = (a.status || '').toUpperCase();
        if (status === 'HADIR') cHadir++;
        else if (status === 'IZIN') cIzin++;
        else if (status === 'SAKIT') cSakit++;
        else if (status === 'ALFA') cAlfa++;
      }
    });
    var cTot = cHadir + cIzin + cSakit + cAlfa;
    return {
      kelas_id: c.kelas_id,
      nama_kelas: c.nama_kelas,
      total_siswa: cStudents.length,
      hadir: cHadir,
      izin: cIzin,
      sakit: cSakit,
      alfa: cAlfa,
      persentase: cTot > 0 ? Math.round((cHadir / cTot) * 100) : 0
    };
  });

  return {
    total_siswa: totalSiswa,
    hadir: hadir,
    izin: izin,
    sakit: sakit,
    alfa: alfa,
    persentase_kehadiran: persentase,
    by_class: byClass
  };
}

/**
 * 5. FITUR TAMBAHAN: REKAP FORMULA DI SHEET BARU
 */
function generateAttendanceSummarySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'REKAP_KEHADIRAN');
  sheet.clear();

  sheet.getRange(1, 1).setValue('REKAPITULASI PRESENSI KELAS DIGITAL')
    .setFontSize(14).setFontWeight('bold');
  sheet.getRange(2, 1).setValue('Terakhir diperbarui: ' + new Date().toLocaleString('id-ID'));

  var headers = ['No', 'Kelas', 'Total Siswa', 'Hadir', 'Izin', 'Sakit', 'Alfa', '% Kehadiran'];
  sheet.getRange(4, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#1e293b')
    .setHorizontalAlignment('center');

  var classes = getSheetData(ss, SHEETS.KELAS);
  var stats = calculateStatisticsGS(ss);

  var rows = [];
  for (var i = 0; i < stats.by_class.length; i++) {
    var c = stats.by_class[i];
    rows.push([
      i + 1,
      c.nama_kelas,
      c.total_siswa,
      c.hadir,
      c.izin,
      c.sakit,
      c.alfa,
      c.persentase + '%'
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(5, 1, rows.length, headers.length).setValues(rows);
  }

  for (var j = 1; j <= headers.length; j++) {
    sheet.autoResizeColumn(j);
  }

  SpreadsheetApp.flush();
  ss.toast('Lembar REKAP_KEHADIRAN berhasil dibuat!', 'Sukses', 5);
}

function cleanExpiredSessions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetSesi = ss.getSheetByName(SHEETS.SESI_ABSENSI);
  if (!sheetSesi || sheetSesi.getLastRow() <= 1) return;

  var sessions = getSheetData(ss, SHEETS.SESI_ABSENSI);
  var headers = sheetSesi.getRange(1, 1, 1, sheetSesi.getLastColumn()).getValues()[0];
  var statusCol = headers.indexOf('status') + 1;

  var closedCount = 0;
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].status === 'OPEN') {
      sheetSesi.getRange(i + 2, statusCol).setValue('CLOSED');
      closedCount++;
    }
  }
  ss.toast(closedCount + ' sesi aktif berhasil ditutup.', 'Pembersihan Selesai', 5);
}

function showSystemInfo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var msg = 'Digital Class Attendance Apps Script Backend\n\n' +
            'Spreadsheet ID:\n' + ss.getId() + '\n\n' +
            'Total Sheet/Tab: ' + ss.getSheets().length + '\n' +
            'Zona Waktu: ' + Session.getScriptTimeZone() + '\n\n' +
            'Untuk menghubungkan dengan frontend di Vercel:\n' +
            '1. Klik Deploy > New deployment > Web app\n' +
            '2. Atur Who has access: Anyone\n' +
            '3. Salin URL Web App dan tempel di Pengaturan Website atau .env Vercel (VITE_APPS_SCRIPT_URL).';
  ui.alert('Status Sistem & Informasi Web App', msg, ui.ButtonSet.OK);
}
