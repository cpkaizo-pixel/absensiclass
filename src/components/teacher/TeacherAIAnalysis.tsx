import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
  Send,
  UserX,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { AIAnalysisResponse, ClassRoom } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../Toast';

export const TeacherAIAnalysis: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Chat / Q&A
  const [question, setQuestion] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string }>
  >([
    {
      sender: 'ai',
      text: 'Halo Bapak/Ibu Guru! Saya asisten AI Analitik Kehadiran. Anda dapat menanyakan tren kehadiran siswa, mengidentifikasi siswa yang membutuhkan bimbingan, atau meminta saran perbaikan kehadiran kelas.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const { showSuccess, showError } = useToast();

  const loadAnalysis = async (kelasId?: string) => {
    setLoadingAnalysis(true);
    try {
      const res = await api.getAIAnalysis(kelasId === 'ALL' ? undefined : kelasId);
      if (res.data) {
        setAnalysis(res.data);
      }
    } catch {
      showError('Gagal memuat analisis AI');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    api.getClasses().then((res) => {
      if (res.data) setClasses(res.data);
    });
    loadAnalysis();
  }, []);

  const handleAskQuestion = async (customPrompt?: string) => {
    const q = customPrompt || question;
    if (!q.trim()) return;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: q, time }]);
    setQuestion('');
    setLoadingChat(true);

    try {
      const res = await api.askAI(q, selectedClassId === 'ALL' ? undefined : selectedClassId);
      if (res.data) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: res.data.answer,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'Maaf, terjadi kendala saat memproses jawaban AI. Silakan coba lagi.',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      showError('Gagal menghubungi asisten AI');
    } finally {
      setLoadingChat(false);
    }
  };

  const sampleQuestions = [
    'Siapa siswa dengan kehadiran terendah bulan ini?',
    'Berapa rata-rata kehadiran kelas XII IPS 1?',
    'Siapa siswa yang sering tidak hadir?',
    'Bagaimana kondisi kehadiran kelas bulan ini?',
    'Berikan rekomendasi untuk meningkatkan kehadiran siswa.',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Powered by Google Gemini API</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Analisis Kehadiran Cerdas (AI)
          </h1>
          <p className="text-sm text-slate-400">
            Dapatkan insight komprehensif, pola kehadiran, dan konsultasi interaktif berbasis data absensi Google Sheets.
          </p>
        </div>

        {/* Filter and Re-Analyze */}
        <div className="flex items-center gap-2">
          <select
            id="select-ai-class"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              loadAnalysis(e.target.value);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.kelas_id} value={c.kelas_id}>
                {c.nama_kelas}
              </option>
            ))}
          </select>

          <button
            id="btn-reanalyze-ai-page"
            onClick={() => loadAnalysis(selectedClassId)}
            disabled={loadingAnalysis}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalysis ? 'animate-spin' : ''}`} />
            <span>ANALISIS ULANG</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Insight Card */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ringkasan Analisis Kehadiran
              </h2>
              <p className="text-xs text-slate-400">Pola dan evaluasi kedisiplinan</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed min-h-[90px] flex items-center">
            {loadingAnalysis ? (
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Gemini AI sedang menganalisis baris Google Sheets...</span>
              </div>
            ) : (
              <p className="font-medium">{analysis?.insight || 'Analisis siap digunakan.'}</p>
            )}
          </div>

          {/* Key Findings / Pola Kehadiran */}
          {analysis?.pola_kehadiran && analysis.pola_kehadiran.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                Pola Kehadiran yang Terdeteksi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.pola_kehadiran.map((pattern, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Siswa Perlu Perhatian Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserX className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Siswa Perlu Perhatian
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Siswa dengan absensi rendah, sering izin/sakit, atau memiliki catatan alfa.
            </p>

            {analysis?.siswa_perlu_perhatian && analysis.siswa_perlu_perhatian.length > 0 ? (
              <div className="space-y-2">
                {analysis.siswa_perlu_perhatian.map((s, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-300">
                      <span>{s.nama}</span>
                      <span className="font-mono text-[11px] text-slate-400">NIS: {s.nis}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{s.alasan}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Semua siswa memiliki kehadiran dalam batas wajar.</span>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {analysis?.rekomendasi && (
            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Rekomendasi Tindakan
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {analysis.rekomendasi.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Interactive AI Chat & Consultation Module */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Konsultasi AI Data Absensi</h2>
            <p className="text-xs text-slate-400">
              Tanyakan apa saja seputar data absensi, siswa teladan, statistik hari, atau rekap khusus.
            </p>
          </div>
        </div>

        {/* Query suggestion pills */}
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              id={`sample-prompt-${idx}`}
              onClick={() => handleAskQuestion(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-left"
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* Chat message flow */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 max-h-96 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
                <span className="block text-[10px] text-slate-400 mt-2 text-right">
                  {msg.time}
                </span>
              </div>
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loadingChat && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Gemini AI sedang berpikir dan menganalisis database...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion();
          }}
          className="flex gap-2"
        >
          <input
            id="input-ai-question"
            type="text"
            placeholder="Ketik pertanyaan untuk AI (misal: 'Siapa siswa yang hadir tepat waktu setiap sesi?')..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            id="btn-send-ai-question"
            type="submit"
            disabled={loadingChat || !question.trim()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
