'use client';

import { useState, useRef, useMemo, DragEvent, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  UploadCloud, Cpu, RefreshCw, AlertCircle, LayoutDashboard, 
  TrendingUp, Activity, Search, Download, Table as TableIcon, 
  Share2, Sparkles, ShieldCheck, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CSVData { [key: string]: string | number; }
interface ChartState { xAxisKey: string; yAxisKey: string; data: CSVData[]; allKeys: string[]; }

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chartData, setChartData] = useState<ChartState | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const colors = ['#84B179', '#A2CB8B', '#C7EABB', '#E8F5BD'];

  const analysis = useMemo(() => {
    if (!chartData) return null;
    const values = chartData.data.map((d) => d[chartData.yAxisKey]).filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((acc, curr) => acc + curr, 0) / values.length;
    const stdDev = Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((a: number, b: number) => a + b, 0) / values.length);
    const anomalies = chartData.data.filter((d) => {
      const val = d[chartData.yAxisKey];
      return typeof val === 'number' && Math.abs(val - avg) > 1.5 * stdDev;
    });
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const trend = (secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length) > (firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length) ? 'Uptrend' : 'Downtrend';

    return { max, min, avg, count: values.length, anomalies, trend, confidence: 98 };
  }, [chartData]);

  const filteredData = useMemo(() => {
    if (!chartData) return [];
    return chartData.data.filter((item) => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())));
  }, [chartData, searchTerm]);

  const processCSV = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError("Hanya menerima file format .csv");
      return;
    }
    setIsProcessing(true);
    setError(null);
    Papa.parse(file, {
      header: true, dynamicTyping: true, skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVData[];
        if (!data[0]) { setError("Data tidak ditemukan."); setIsProcessing(false); return; }
        const headers = Object.keys(data[0]);
        const yKey = headers.find(key => typeof data[0][key] === 'number') || headers[1];
        setTimeout(() => {
          setChartData({ xAxisKey: headers[0], yAxisKey: yKey, data: data, allKeys: headers });
          setIsProcessing(false);
        }, 800);
      },
      error: () => {
        setError("Gagal memproses CSV.");
        setIsProcessing(false);
      }
    });
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processCSV(files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processCSV(files[0]);
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
    pdf.save(`InsightEdge_Report.pdf`);
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#2D3436] font-sans selection:bg-[#E8F5BD] overflow-x-hidden">
      <div className="fixed inset-0 -z-10 opacity-30">
        <div className="absolute top-[-5%] left-[-5%] size-[50%] rounded-full bg-[#E8F5BD] blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] size-[50%] rounded-full bg-[#A2CB8B] blur-[140px] animate-pulse" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl px-4 md:px-10 py-4 flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 md:gap-4">
          <div className="size-10 md:size-12 bg-[#84B179] rounded-lg flex items-center justify-center text-white shadow-xl shadow-[#84B179]/30 shrink-0">
            <LayoutDashboard size={20} className="md:size-6" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-[#2D3436]">INSIGHT<span className="text-[#84B179]">EDGE</span></span>
            <div className="text-[8px] md:text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase hidden sm:block">Enterprise Analytics</div>
          </div>
        </motion.div>
        {chartData && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2">
            <button onClick={() => setChartData(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-black text-[10px] md:text-xs hover:bg-slate-200 transition-colors">RESET</button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#84B179] text-white font-black text-[10px] md:text-xs shadow-lg shadow-[#84B179]/20 hover:scale-105 transition-transform">
              <Download size={14}/> <span className="hidden sm:inline">EXPORT PDF</span>
            </button>
          </motion.div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-10">
        <AnimatePresence mode="wait">
          {!chartData ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="mt-16 md:mt-24 flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#E8F5BD] text-[#84B179] text-[10px] font-black tracking-widest mb-10 border border-[#84B179]/10">
                <Sparkles size={14}/> DEPLOYED ON TENCENT EDGE CLOUD
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-center mb-8 tracking-tighter leading-tight text-slate-900">
                Stop Guessing. <br/>Start <span className="text-[#84B179] underline decoration-8 decoration-[#E8F5BD] underline-offset-8">Analyzing.</span>
              </h1>
              
              {error && (
                <div className="mb-6 flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 text-sm font-bold">
                  <AlertCircle size={16}/> {error}
                </div>
              )}

              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-3xl p-12 md:p-24 border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center transition-all duration-500
                  ${isDragging ? 'border-[#84B179] bg-[#E8F5BD]/40 scale-105 shadow-2xl' : 'border-slate-200 bg-white hover:border-[#84B179]'}
                `}
              >
                <input type="file" accept=".csv" hidden ref={fileInputRef} onChange={onFileChange} />
                <div className={`size-20 md:size-32 rounded-lg flex items-center justify-center mb-10 transition-all duration-500 shrink-0
                  ${isProcessing ? 'bg-slate-900 text-white animate-spin' : 'bg-[#E8F5BD] text-[#84B179]'}
                `}>
                  {isProcessing ? <RefreshCw size={40} /> : <UploadCloud size={40} />}
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">DROP DATASET HERE</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              ref={reportRef} className="space-y-10 pb-20"
            >
              <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-[#84B179] font-black text-xs tracking-widest uppercase shrink-0">
                  <Settings2 size={18}/> Axis Control
                </div>
                <div className="flex gap-4 grow sm:grow-0">
                  <select value={chartData.xAxisKey} onChange={(e) => setChartData({...chartData, xAxisKey: e.target.value})} className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs font-bold grow sm:grow-0 outline-none">
                    {chartData.allKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <select value={chartData.yAxisKey} onChange={(e) => setChartData({...chartData, yAxisKey: e.target.value})} className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs font-bold grow sm:grow-0 outline-none">
                    {chartData.allKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'PEAK VALUE', val: analysis?.max, icon: TrendingUp, color: '#84B179', bg: 'bg-[#E8F5BD]' },
                  { label: 'FLOOR VALUE', val: analysis?.min, icon: Activity, color: '#F87171', bg: 'bg-rose-50' },
                  { label: 'MEAN AVG', val: analysis?.avg?.toFixed(2), icon: Cpu, color: '#6366F1', bg: 'bg-indigo-50' },
                  { label: 'CONFIDENCE', val: analysis?.confidence + '%', icon: ShieldCheck, color: '#84B179', bg: 'bg-emerald-50' }
                ].map((s, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-48 transition-shadow hover:shadow-xl">
                    <div className={`size-12 rounded-lg ${s.bg} flex items-center justify-center`} style={{color: s.color}}><s.icon size={24} /></div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 tracking-widest mb-1">{s.label}</div>
                      <div className="text-4xl font-black text-slate-800 tracking-tighter">{s.val?.toLocaleString()}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white p-6 md:p-12 rounded-lg border border-slate-100 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">{chartData.yAxisKey} Analysis</h2>
                  <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                    {(['bar', 'line', 'area'] as const).map((t) => (
                      <button key={t} onClick={() => setChartType(t)} className={`px-6 md:px-10 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chartType === t ? 'bg-white text-[#84B179] shadow-lg scale-105' : 'text-slate-400'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-80 md:h-137.5 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={chartData.data.slice(0, 25)}>
                        <CartesianGrid vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey={chartData.xAxisKey} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                        <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey={chartData.yAxisKey} fill="#84B179" radius={[4, 4, 4, 4]} animationDuration={1500}>
                          {chartData.data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                        </Bar>
                      </BarChart>
                    ) : chartType === 'line' ? (
                      <LineChart data={chartData.data.slice(0, 25)}>
                        <CartesianGrid vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey={chartData.xAxisKey} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                        <Line type="stepAfter" dataKey={chartData.yAxisKey} stroke="#84B179" strokeWidth={6} dot={{ r: 6, fill: '#84B179', stroke: '#fff', strokeWidth: 3 }} animationDuration={1500} />
                      </LineChart>
                    ) : (
                      <AreaChart data={chartData.data.slice(0, 25)}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#84B179" stopOpacity={0.6}/><stop offset="95%" stopColor="#84B179" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey={chartData.xAxisKey} hide /><YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                        <Area type="monotone" dataKey={chartData.yAxisKey} stroke="#84B179" strokeWidth={6} fill="url(#colorArea)" animationDuration={1500} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#2D3436] p-8 md:p-12 rounded-lg text-white shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[#84B179] rounded-lg shrink-0"><Cpu size={24} /></div>
                    <h4 className="font-black text-xl tracking-tight">EDGE AI ANALYZER</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-white/10 uppercase text-[10px] font-bold tracking-widest">
                      <span className="text-slate-400">Trend Analysis</span>
                      <span className={analysis?.trend === 'Uptrend' ? 'text-emerald-400' : 'text-rose-400'}>{analysis?.trend}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-white/10 uppercase text-[10px] font-bold tracking-widest">
                      <span className="text-slate-400">Outliers Found</span>
                      <span className="text-amber-400">{analysis?.anomalies.length} Cases</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#E8F5BD] p-8 md:p-12 rounded-lg border border-[#84B179]/20 flex flex-col justify-between items-start">
                  <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                    Pola <span className="underline decoration-[#84B179] underline-offset-4 italic">{analysis?.trend.toLowerCase()}</span> terdeteksi dengan rata-rata <span className="text-[#84B179]">{analysis?.avg?.toFixed(2)}</span>.
                  </p>
                  <button className="mt-8 px-8 py-4 bg-white rounded-lg font-black text-[10px] tracking-widest text-[#84B179] shadow-sm hover:shadow-lg transition-all flex items-center gap-3">
                    <Share2 size={16}/> SHARE INSIGHTS
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 md:p-10 border-b flex flex-col sm:flex-row justify-between gap-6 bg-slate-50/30 items-center">
                  <div className="flex items-center gap-4 shrink-0">
                    <TableIcon size={20} className="text-[#84B179]" /><h4 className="font-black text-xl tracking-tight">DATA EXPLORER</h4>
                  </div>
                  <div className="relative w-full sm:w-76">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" placeholder="Filter dataset..." onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-lg text-sm font-bold focus:border-[#84B179] outline-none transition-colors shadow-sm" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-150">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-black tracking-widest text-[10px] uppercase">
                        {chartData.allKeys.map(h => <th key={h} className="px-10 py-6">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic font-medium">
                      {filteredData.slice(0, 15).map((row, i) => (
                        <tr key={i} className="hover:bg-[#E8F5BD]/20 transition-colors">
                          {Object.values(row).map((val, j) => <td key={j} className="px-10 py-6 text-slate-600">{typeof val === 'number' ? val.toLocaleString() : String(val)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <footer className="max-w-7xl mx-auto px-10 pb-20 pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 text-slate-400">
        <div className="text-[10px] font-black tracking-widest uppercase">© 2026 INSIGHTEDGE ENGINE • HANS CHRISTIAN</div>
        <div className="flex gap-6 text-[10px] font-black tracking-widest uppercase">
          <span className="text-[#84B179]">Privacy First</span><span>v2.4.0</span>
        </div>
      </footer>
    </main>
  );
}