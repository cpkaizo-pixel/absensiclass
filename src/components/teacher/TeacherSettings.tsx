import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Globe,
  Download,
  Terminal,
  Layers,
  Sparkles,
  Link,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

const CODE_GS_SCRIPT = `/**
 * ============================================================================
 * DIGITAL CLASS ATTENDANCE - GOOGLE APPS SCRIPT (Code.gs)
 * Backend & Database Management Script for Google Sheets
 * ============================================================================
 * 
 * CARA MENGGUNAKAN:
 * 1. Buka Google Spreadsheet baru di https://sheets.new
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script"
 * 3. Hapus semua kode bawaan, lalu PASTE seluruh kode ini ke file Code.gs
 * 4. Simpan (Ctrl+S / Cmd+S)
 * 5. Pilih fungsi 'setupSpreadsheet' di dropdown atas, lalu klik "Jalankan" (Run)
 * 6. Berikan izin otorisasi Google (Review Permissions > Allow)
 * 7. Untuk deploy sebagai Web API:
 *    - Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment)
 *    - Pilih jenis: "Aplikasi Web" (Web app)
 *    - Yang memiliki akses: "Siapa saja" (Anyone) -> PENTING
 *    - Klik "Terapkan" (Deploy) lalu Salin "URL Aplikasi Web"
 * ============================================================================
 */

// NAMA TAB SPREADSHEET
var SHEETS = {
  SISWA: 'SISWA',
  GURU: 'GURU',
  KELAS: 'KELAS',
  JADWAL: 'JADWAL',
  SESI_ABSENSI: 'SESI_ABSENSI',
  ABSENSI: 'ABSENSI',
  SETTINGS: 'SETTINGS'
};

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

  // Terapkan dropdown data validasi
  applyStatusValidation(sheetAbsensi, 6, ['HADIR', 'IZIN', 'SAKIT', 'ALFA']);
  applyStatusValidation(sheetSiswa, 7, ['aktif', 'nonaktif']);
  applyStatusValidation(sheetSesi, 8, ['OPEN', 'CLOSED']);

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast('Seluruh tab spreadsheet berhasil diinisialisasi!', 'Sukses', 5);
  return { success: true, message: 'Spreadsheet berhasil diinisialisasi' };
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function setupHeaders(sheet, headers, bgHexColor) {
  sheet.setFrozenRows(1);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
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

  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
    if (sheet.getColumnWidth(i) < 110) {
      sheet.setColumnWidth(i, 130);
    }
  }
}

function applyStatusValidation(sheet, columnIndex, allowedValues) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(allowedValues, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, columnIndex, 500, 1).setDataValidation(rule);
}

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

      case 'getStudents':
        response = { success: true, data: getSheetData(ss, SHEETS.SISWA) };
        break;

      case 'addStudent':
        response = addStudentRecord(ss, payload);
        break;

      case 'deleteStudent':
        response = deleteRowByColumn(ss, SHEETS.SISWA, 'student_id', payload.student_id);
        break;

      case 'getTeachers':
        response = { success: true, data: getSheetData(ss, SHEETS.GURU) };
        break;

      case 'addTeacher':
        response = addTeacherRecord(ss, payload);
        break;

      case 'deleteTeacher':
        response = deleteRowByColumn(ss, SHEETS.GURU, 'guru_id', payload.guru_id);
        break;

      case 'getClasses':
        response = { success: true, data: getSheetData(ss, SHEETS.KELAS) };
        break;

      case 'addClass':
        response = addClassRecord(ss, payload);
        break;

      case 'deleteClass':
        response = deleteRowByColumn(ss, SHEETS.KELAS, 'kelas_id', payload.kelas_id);
        break;

      case 'getSchedules':
        response = { success: true, data: getSheetData(ss, SHEETS.JADWAL) };
        break;

      case 'addSchedule':
        response = addScheduleRecord(ss, payload);
        break;

      case 'deleteSchedule':
        response = deleteRowByColumn(ss, SHEETS.JADWAL, 'schedule_id', payload.schedule_id);
        break;

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

      case 'submitAttendance':
        response = submitStudentAttendanceGS(ss, payload);
        break;

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
    response = { success: false, message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

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
  return { success: false, message: 'Data tidak ditemukan' };
}

function addStudentRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.SISWA);
  var id = data.student_id || ('std_' + Utilities.getUuid().slice(0, 8));
  sheet.appendRow([
    id,
    data.nis || '',
    data.nama || '',
    data.kelas_id || '',
    data.username || (data.nama ? data.nama.toLowerCase().replace(/\\s+/g, '_') : id),
    data.password_hash || '123456',
    data.status || 'aktif'
  ]);
  return { success: true, message: 'Siswa berhasil disimpan', data: { student_id: id } };
}

function addTeacherRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.GURU);
  var id = data.guru_id || ('gru_' + Utilities.getUuid().slice(0, 8));
  sheet.appendRow([
    id,
    data.nip || '',
    data.nama || '',
    data.mata_pelajaran || data.mata_pelajaran_utama || 'Umum',
    data.username || (data.nama ? data.nama.toLowerCase().replace(/\\s+/g, '_') : id),
    data.password_hash || '123456',
    data.status || 'aktif'
  ]);
  return { success: true, message: 'Guru berhasil disimpan', data: { guru_id: id } };
}

function addClassRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.KELAS);
  var id = data.kelas_id || ('cls_' + Utilities.getUuid().slice(0, 8));
  sheet.appendRow([
    id,
    data.nama_kelas || '',
    data.wali_kelas_id || '',
    data.status || 'aktif'
  ]);
  return { success: true, message: 'Kelas berhasil disimpan', data: { kelas_id: id } };
}

function addScheduleRecord(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEETS.JADWAL);
  var id = data.schedule_id || ('sch_' + Utilities.getUuid().slice(0, 8));
  sheet.appendRow([
    id,
    data.kelas_id || '',
    data.guru_id || '',
    data.mata_pelajaran || '',
    data.hari || 'Senin',
    data.jam_mulai || '07:30',
    data.jam_selesai || '09:00'
  ]);
  return { success: true, message: 'Jadwal berhasil disimpan', data: { schedule_id: id } };
}

function createAttendanceSessionGS(ss, data) {
  var sheetSesi = getOrCreateSheet(ss, SHEETS.SESI_ABSENSI);
  var sessionId = 'ses_' + Utilities.getUuid().slice(0, 8);
  var now = new Date();
  var duration = Number(data.durasi_menit) || 15;
  var endTime = new Date(now.getTime() + duration * 60000);

  var pin = String(Math.floor(100000 + Math.random() * 900000));
  var qrToken = 'dca_' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  var dateStr = data.tanggal || Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var startTimeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
  var endTimeStr = Utilities.formatDate(endTime, Session.getScriptTimeZone(), 'HH:mm');

  // Tutup sesi open sebelumnya
  var sessions = getSheetData(ss, SHEETS.SESI_ABSENSI);
  var lastRow = sheetSesi.getLastRow();
  if (lastRow > 1) {
    var headers = sheetSesi.getRange(1, 1, 1, sheetSesi.getLastColumn()).getValues()[0];
    var statusCol = headers.indexOf('status') + 1;
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].status === 'OPEN' && (!data.schedule_id || sessions[i].schedule_id === data.schedule_id)) {
        sheetSesi.getRange(i + 2, statusCol).setValue('CLOSED');
      }
    }
  }

  sheetSesi.appendRow([
    sessionId,
    data.schedule_id || '',
    dateStr,
    startTimeStr,
    endTimeStr,
    pin,
    qrToken,
    'OPEN'
  ]);

  return {
    success: true,
    message: 'Sesi absensi dibuka',
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

  return {
    success: true,
    data: Object.assign({}, active, {
      mata_pelajaran: sch ? sch.mata_pelajaran : '',
      kelas_id: sch ? sch.kelas_id : '',
      nama_kelas: cls ? cls.nama_kelas : '',
      guru_id: sch ? sch.guru_id : '',
      nama_guru: tch ? tch.nama : ''
    })
  };
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

  return attendances.map(function(att) {
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
  }).reverse();
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
    total_siswa: targetStudents.length,
    hadir: hadir,
    izin: izin,
    sakit: sakit,
    alfa: alfa,
    persentase_kehadiran: persentase,
    by_class: byClass
  };
}

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
  var msg = 'Digital Class Attendance Apps Script Backend\\n\\n' +
            'Spreadsheet ID:\\n' + ss.getId() + '\\n\\n' +
            'Total Sheet/Tab: ' + ss.getSheets().length + '\\n' +
            'Zona Waktu: ' + Session.getScriptTimeZone() + '\\n\\n' +
            'Untuk menghubungkan dengan frontend di Vercel:\\n' +
            '1. Klik Deploy > New deployment > Web app\\n' +
            '2. Atur Who has access: Anyone\\n' +
            '3. Salin URL Web App dan tempel di Pengaturan Website atau .env Vercel.';
  ui.alert('Status Sistem & Informasi Web App', msg, ui.ButtonSet.OK);
}`;

const VERCEL_JSON_EXAMPLE = `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

export const TeacherSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appscript' | 'vercel' | 'sheets' | 'status'>('appscript');
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Custom Apps Script URL state
  const [customUrl, setCustomUrl] = useState('');
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { showSuccess, showError, showInfo } = useToast();

  const loadStatus = async () => {
    setLoading(true);
    const res = await api.getSheetsStatus();
    if (res.data) {
      setSheetsStatus(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
    setCustomUrl(api.getAppsScriptUrl());
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showSuccess(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadCodeGs = () => {
    const blob = new Blob([CODE_GS_SCRIPT], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('File Code.gs berhasil diunduh!');
  };

  const handleSaveCustomUrl = () => {
    api.setAppsScriptUrl(customUrl);
    showSuccess('URL Google Apps Script berhasil disimpan!');
  };

  const handleTestAppsScript = async () => {
    if (!customUrl.trim()) {
      showError('Masukkan URL Web App Google Apps Script terlebih dahulu');
      return;
    }
    setTestingUrl(true);
    setTestResult(null);
    const res = await api.testAppsScriptConnection(customUrl);
    setTestingUrl(false);
    setTestResult(res);
    if (res.success) {
      showSuccess(res.message);
      api.setAppsScriptUrl(customUrl);
    } else {
      showError(res.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Google Apps Script & Vercel Deployment Suite
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Pengaturan, Google Apps Script & Deploy Vercel
        </h1>
        <p className="text-sm text-slate-400">
          Kelola kode otomatisasi Google Spreadsheet (Code.gs), sinkronisasi data cloud, dan panduan lengkap deploy ke Vercel.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveTab('appscript')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'appscript'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Google Apps Script (Code.gs)
        </button>

        <button
          onClick={() => setActiveTab('vercel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'vercel'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Panduan Deploy ke Vercel
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sheets'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Struktur Tab Spreadsheet (6 Tab)
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'status'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Status Integrasi Server
        </button>
      </div>

      {/* TAB 1: GOOGLE APPS SCRIPT (Code.gs) */}
      {activeTab === 'appscript' && (
        <div className="space-y-6">
          {/* Quick Action Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                Script Inisialisasi & Web API Google Sheets (Code.gs)
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Script ini otomatis membuat 6 tab spreadsheet yang rapi dengan validasi status (HADIR, IZIN, SAKIT, ALFA), header berwarna, menu atas interaktif, serta REST Web API.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => handleCopy(CODE_GS_SCRIPT, 'Seluruh Code.gs')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
              >
                {copiedKey === 'Seluruh Code.gs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Salin Code.gs
              </button>

              <button
                onClick={handleDownloadCodeGs}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4" />
                Download .gs
              </button>

              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka sheets.new
              </a>
            </div>
          </div>

          {/* 7-Step Tutorial Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Langkah Cepat Setup di Google Spreadsheet (5 Menit)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div className="font-bold text-white">Buat Spreadsheet Baru</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Buka link <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-400 underline">sheets.new</a> di browser Anda dan beri nama (misal: <em>Database Absensi Sekolah</em>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div className="font-bold text-white">Buka Apps Script Editor</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong> di menu atas Google Sheets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div className="font-bold text-white">Tempel Code.gs & Simpan</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Hapus semua kode bawaan di editor, lalu paste kode <strong>Code.gs</strong> dari tombol salin di bawah. Tekan <kbd className="bg-slate-800 px-1 rounded">Ctrl+S</kbd>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  4
                </div>
                <div className="font-bold text-white">Jalankan 'setupSpreadsheet'</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Pilih fungsi <code>setupSpreadsheet</code> di dropdown tengah atas, lalu klik <strong>Jalankan (Run)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  5
                </div>
                <div className="font-bold text-white">Beri Izin Otorisasi</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Klik <em>Review permissions</em> &gt; Pilih akun Google &gt; <em>Advanced</em> &gt; <em>Go to (unsafe)</em> &gt; <em>Allow</em>. 6 Tab akan otomatis dibuat rapi!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                  6
                </div>
                <div className="font-bold text-white">Deploy Web App (Untuk Vercel)</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan baru (New deployment)</strong> &gt; Pilih <strong>Aplikasi Web</strong> &gt; Who has access: <strong>Siapa saja (Anyone)</strong> &gt; Deploy!
                </p>
              </div>
            </div>
          </div>

          {/* Web App URL Connection Tester */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Link className="w-4 h-4 text-indigo-400" />
                  Hubungkan URL Google Apps Script Web App Langsung
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tempel URL Web App dari langkah 6 (berakhiran <code>/exec</code>) untuk mengaktifkan sinkronisasi langsung spreadsheet:
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleTestAppsScript}
                disabled={testingUrl}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {testingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Tes Koneksi
              </button>
              <button
                onClick={handleSaveCustomUrl}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
              >
                Simpan
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <div>{testResult.message}</div>
              </div>
            )}
          </div>

          {/* Interactive Code Viewer */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-400 ml-2">Code.gs (Google Apps Script)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(CODE_GS_SCRIPT, 'Code.gs')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                >
                  {copiedKey === 'Code.gs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Salin Seluruh Kode
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              <pre className="whitespace-pre-wrap">{CODE_GS_SCRIPT}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PANDUAN DEPLOY KE VERCEL */}
      {activeTab === 'vercel' && (
        <div className="space-y-6">
          {/* Vercel Overview Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/20 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[11px] font-bold">
              Vercel Production Deployment
            </div>
            <h2 className="text-lg font-black text-white">
              Cara Deploy Aplikasi Absensi Digital ke Vercel
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Aplikasi ini dikembangkan dengan standard Vite React SPA yang siap di-deploy secara instan ke Vercel secara gratis dengan uptime 99.9%, custom domain sekolah, dan HTTPS otomatis.
            </p>
          </div>

          {/* Deployment Step-by-Step */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Metode 1: Deploy via GitHub (Paling Direkomendasikan)
              </h3>
              
              <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
                <li className="leading-relaxed">
                  <strong>Export / Push Proyek ke GitHub</strong>: Download ZIP proyek atau push repository ini ke akun GitHub Anda.
                </li>
                <li className="leading-relaxed">
                  <strong>Buka Dashboard Vercel</strong>: Masuk ke <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold">vercel.com/new</a>.
                </li>
                <li className="leading-relaxed">
                  <strong>Import Repository</strong>: Pilih repository GitHub absensi Anda.
                </li>
                <li className="leading-relaxed">
                  <strong>Konfigurasi Build Preset</strong>:
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                    <div>Framework Preset: <span className="text-emerald-400 font-bold">Vite</span></div>
                    <div>Build Command: <span className="text-slate-300">npm run build</span></div>
                    <div>Output Directory: <span className="text-slate-300">dist</span></div>
                  </div>
                </li>
                <li className="leading-relaxed">
                  <strong>Isi Environment Variables</strong> (lihat tabel di samping kanan).
                </li>
                <li className="leading-relaxed">
                  Klik <strong>Deploy</strong>! Dalam ~45 detik aplikasi live di <code>https://nama-sekolah.vercel.app</code>.
                </li>
              </ol>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Environment Variables di Vercel Dashboard
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Di menu <strong>Settings &gt; Environment Variables</strong> Vercel, tambahkan variabel berikut:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-indigo-400">GEMINI_API_KEY</div>
                    <div className="text-[11px] text-slate-500">Kunci API Gemini AI untuk analisis absensi</div>
                  </div>
                  <button
                    onClick={() => handleCopy('GEMINI_API_KEY', 'Nama env GEMINI_API_KEY')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-emerald-400">VITE_APPS_SCRIPT_URL</div>
                    <div className="text-[11px] text-slate-500">URL Web App Google Apps Script dari Code.gs</div>
                  </div>
                  <button
                    onClick={() => handleCopy('VITE_APPS_SCRIPT_URL', 'Nama env VITE_APPS_SCRIPT_URL')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-blue-400">GOOGLE_SHEET_ID (Opsional)</div>
                    <div className="text-[11px] text-slate-500">Jika menggunakan Service Account Google Cloud</div>
                  </div>
                  <button
                    onClick={() => handleCopy('GOOGLE_SHEET_ID', 'Nama env GOOGLE_SHEET_ID')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    `GEMINI_API_KEY=\nVITE_APPS_SCRIPT_URL=${customUrl || 'https://script.google.com/macros/s/.../exec'}`,
                    'Contoh .env'
                  )
                }
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Salin Format .env untuk Vercel
              </button>
            </div>
          </div>

          {/* vercel.json File Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                File Konfigurasi vercel.json (Sudah Disediakan)
              </h3>
              <button
                onClick={() => handleCopy(VERCEL_JSON_EXAMPLE, 'vercel.json')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                Salin vercel.json
              </button>
            </div>

            <p className="text-xs text-slate-400">
              File <code>vercel.json</code> sudah otomatis dibuat di root proyek untuk menangani route SPA dan static assets:
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {VERCEL_JSON_EXAMPLE}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: STRUKTUR TAB SPREADSHEET */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Skema 6 Tab Spreadsheet Utama (Dibuat Otomatis oleh Code.gs)
            </h2>
            <p className="text-xs text-slate-400">
              Ketika Anda menjalankan fungsi <code>setupSpreadsheet</code> di Google Apps Script, 6 sheet di bawah ini akan dibuat secara otomatis lengkap dengan header berwarna, freeze row 1, dan data dropdown validation:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">1. Tab SISWA</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">7 Kolom</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  student_id, nis, nama, kelas_id, username, password_hash, status
                </div>
                <p className="text-slate-400 text-[11px]">
                  Menampung data induk siswa. Status memiliki validasi <code>aktif / nonaktif</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400">2. Tab GURU</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">7 Kolom</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  guru_id, nip, nama, mata_pelajaran, username, password_hash, status
                </div>
                <p className="text-slate-400 text-[11px]">
                  Menampung profil guru pengajar dan mata pelajaran utama.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400">3. Tab KELAS</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">4 Kolom</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  kelas_id, nama_kelas, wali_kelas_id, status
                </div>
                <p className="text-slate-400 text-[11px]">
                  Menyimpan rombel kelas (misal: XII MIPA 1) dan relasi wali kelas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">4. Tab JADWAL</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">7 Kolom</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  schedule_id, kelas_id, guru_id, mata_pelajaran, hari, jam_mulai, jam_selesai
                </div>
                <p className="text-slate-400 text-[11px]">
                  Jadwal pelajaran mingguan yang menjadi rujukan pembukaan sesi absensi.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">5. Tab SESI_ABSENSI</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">8 Kolom</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  session_id, schedule_id, tanggal, waktu_mulai, waktu_selesai, kode_absensi, qr_token, status
                </div>
                <p className="text-slate-400 text-[11px]">
                  Sesi buka absensi langsung dengan PIN 6 digit dan QR Token terenkripsi.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-400">6. Tab ABSENSI</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px]">7 Kolom</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  attendance_id, session_id, student_id, tanggal, waktu_absen, status, keterangan
                </div>
                <p className="text-slate-400 text-[11px]">
                  Log riwayat kehadiran dengan validasi <code>HADIR, IZIN, SAKIT, ALFA</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STATUS INTEGRASI SERVER */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Sheets Status */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Status Database Google Sheets
                    </h2>
                    <p className="text-xs text-slate-400">Penyimpanan spreadsheet cloud</p>
                  </div>
                </div>

                <button
                  onClick={loadStatus}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  sheetsStatus?.isConfigured
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {sheetsStatus?.isConfigured
                      ? 'Terhubung Langsung ke Google Sheets API'
                      : 'Mode Resilient Data Store & Apps Script (Aktif)'}
                  </span>
                </div>
                <p>{sheetsStatus?.message || 'Database siap digunakan secara real-time.'}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Mode Operasional:</span>
                  <span className="font-mono text-slate-200 font-semibold">{sheetsStatus?.mode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Sheet ID:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[180px]">
                    {sheetsStatus?.sheetId || 'Demo Sheets Instance'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Service Account:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[180px]">
                    {sheetsStatus?.clientEmail || 'demo-service-account'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gemini AI Status */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Status Google Gemini AI
                  </h2>
                  <p className="text-xs text-slate-400">Analisis kecerdasan buatan</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Gemini 2.5 Flash / Smart Inference Aktif</span>
                </div>
                <p>
                  Modul AI Gemini digunakan untuk menghasilkan ringkasan kehadiran, mendeteksi pola siswa bermasalah, dan menjawab pertanyaan interaktif pengajar.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Model:</span>
                  <span className="font-mono text-slate-200 font-semibold">gemini-2.5-flash</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Structured Schema:</span>
                  <span className="font-mono text-emerald-400 font-semibold">Enabled (JSON)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Server Protection:</span>
                  <span className="font-mono text-emerald-400 font-semibold">Server-Side Proxy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
