import { AttendanceStatus } from '../types';

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeIndo(timeStr?: string): string {
  if (!timeStr) return '-';
  return timeStr.slice(0, 5) + ' WIB';
}

export function getStatusBadgeClass(status: AttendanceStatus): string {
  switch (status) {
    case 'HADIR':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
    case 'IZIN':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20';
    case 'SAKIT':
      return 'bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-500/20';
    case 'ALFA':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'HADIR':
      return 'Hadir';
    case 'IZIN':
      return 'Izin';
    case 'SAKIT':
      return 'Sakit';
    case 'ALFA':
      return 'Alfa (Tanpa Keterangan)';
    default:
      return status;
  }
}

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
