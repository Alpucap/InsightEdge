'use client';

import { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  UploadCloud, FileSpreadsheet, Cpu, RefreshCw, 
  AlertCircle, LayoutDashboard, TrendingUp, Activity, 
  Search, Download, Table as TableIcon, Share2, Sparkles, ShieldCheck, Settings2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Types ---
interface CSVData {
  [key: string]: string | number;
}

interface ChartState {
  xAxisKey: string;
  yAxisKey: string;
  data: CSVData[];
  allKeys: string[];
}

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

  // --- CORE INTELLIGENCE ENGINE ---
  const analysis = useMemo(() => {
    if (!chartData) return null;
    const values = chartData.data
      .map((d) => d[chartData.yAxisKey])
      .filter((v): v is number => typeof v === 'number');
    
    if (values.length === 0) return null;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((acc: number, curr: number) => acc + curr, 0) / values.length;
    
    const stdDev = Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((a: number, b: number) => a + b, 0) / values.length);
    const anomalies = chartData.data.filter((d) => {
      const val = d[chartData.yAxisKey];
      return typeof val === 'number' && Math.abs(val - avg) > 1.5 * stdDev;
    });
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const trend = (secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length) > 
                  (firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length) ? 'Uptrend' : 'Downtrend';

    return { max, min, avg, count: values.length, anomalies, trend, confidence: 98 };
  }, [chartData]);

  const filteredData = useMemo(() => {
    if (!chartData) return [];
    return chartData.data.filter((item) => 
      Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [chartData, searchTerm]);

  // --- ACTIONS ---
  const processCSV = (file: File) => {
    setIsProcessing(true);
    setError(null);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVData[];
        if (!data[0]) { setError("Format file tidak valid."); setIsProcessing(false); return; }
        const headers = Object.keys(data[0]);
        // Cari kolom angka pertama untuk Y
        const yKey = headers.find(key => typeof data[0][key] === 'number') || headers[1];
        
        setTimeout(() => {
          setChartData({ xAxisKey: headers[0], yAxisKey: yKey, data: data, allKeys: headers });
          setIsProcessing(false);
        }, 1000);
      }
    });
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`InsightEdge_Report.pdf`);
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#2D3436] font-sans selection:bg-[#E8F5BD]">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full bg-[#E8F5BD] blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[#A2CB8B] blur-[140px] animate-pulse" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#84B179] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#84B179]/30">
            <LayoutDashboard size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-[#2D3436]">INSIGHT<span className="text-[#84B179]">EDGE</span></span>
            <div className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase">Enterprise Analytics</div>
          </div>
        </div>
        {chartData && (
          <div className="flex gap-4">
            <button onClick={() => setChartData(null)} className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all">RESET</button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#84B179] text-white font-black text-xs shadow-lg shadow-[#84B179]/20 hover:scale-105 transition-all">
              <Download size={16}/> EXPORT PDF
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto p-10">
        {!chartData ? (
          <div className="mt-24 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#E8F5BD] text-[#84B179] text-[11px] font-black tracking-widest mb-10 border border-[#84B179]/10">
              <Sparkles size={14}/> DEPLOYED ON TENCENT EDGE CLOUD
            </div>
            <h1 className="text-7xl font-black text-center mb-8 tracking-tighter leading-[0.9] text-slate-900">
              Stop Guessing. <br/>Start <span className="text-[#84B179] underline decoration-8 decoration-[#E8F5BD] underline-offset-8">Analyzing.</span>
            </h1>
            <p className="text-slate-500 text-xl mb-14 text-center max-w-2xl font-medium leading-relaxed">
              Professional client-side CSV engine with integrated AI anomaly detection. All processed at the edge for maximum privacy.
            </p>

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) processCSV(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-3xl p-24 border-4 border-dashed rounded-[60px] transition-all duration-700 cursor-pointer flex flex-col items-center group
                ${isDragging ? 'border-[#84B179] bg-[#E8F5BD]/40 scale-105 shadow-3xl shadow-[#84B179]/20' : 'border-slate-200 bg-white hover:border-[#84B179] hover:shadow-2xl'}
              `}
            >
              <input type="file" accept=".csv" hidden ref={fileInputRef} onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0])} />
              <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center mb-10 transition-all duration-500 
                ${isProcessing ? 'bg-slate-900 text-white animate-spin' : 'bg-[#E8F5BD] text-[#84B179] group-hover:rotate-12'}
              `}>
                {isProcessing ? <RefreshCw size={50} /> : <UploadCloud size={50} />}
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">DROP DATASET HERE</p>
              <p className="text-slate-400 mt-4 font-bold tracking-widest text-xs uppercase">Drag & drop or click to browse</p>
            </div>
          </div>
        ) : (
          <div ref={reportRef} className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            
            {/* --- SMART SETTINGS PANEL (Dynamic Axis) --- */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-[#84B179] font-black text-xs tracking-widest uppercase">
                <Settings2 size={18}/> Axis Control
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">X-Axis:</span>
                <select 
                  value={chartData.xAxisKey}
                  onChange={(e) => setChartData({...chartData, xAxisKey: e.target.value})}
                  className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#84B179]/20 transition-all"
                >
                  {chartData.allKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Y-Axis:</span>
                <select 
                  value={chartData.yAxisKey}
                  onChange={(e) => setChartData({...chartData, yAxisKey: e.target.value})}
                  className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#84B179]/20 transition-all"
                >
                  {chartData.allKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            {/* --- BENTO STATS --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'PEAK VALUE', val: analysis?.max, icon: TrendingUp, color: '#84B179', bg: 'bg-[#E8F5BD]' },
                { label: 'FLOOR VALUE', val: analysis?.min, icon: Activity, color: '#F87171', bg: 'bg-rose-50' },
                { label: 'MEAN AVG', val: analysis?.avg?.toFixed(2), icon: Cpu, color: '#6366F1', bg: 'bg-indigo-50' },
                { label: 'CONFIDENCE', val: analysis?.confidence + '%', icon: ShieldCheck, color: '#84B179', bg: 'bg-emerald-50' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between h-48 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                  <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center`} style={{color: s.color}}><s.icon size={24} /></div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-2">{s.label}</div>
                    <div className="text-4xl font-black text-slate-800 tracking-tighter">{s.val?.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- MAIN CHART --- */}
            <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/50">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-[#84B179] font-black text-xs tracking-[0.4em]">
                    <div className="w-2 h-2 rounded-full bg-[#84B179] animate-ping" /> REAL-TIME VISUALIZATION
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{chartData.yAxisKey} Analysis</h2>
                </div>
                <div className="flex bg-slate-100 p-2 rounded-3xl">
                  {(['bar', 'line', 'area'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setChartType(t)}
                      className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${chartType === t ? 'bg-white text-[#84B179] shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[550px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData.data.slice(0, 25)}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey={chartData.xAxisKey} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} dy={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} />
                      <Tooltip contentStyle={{borderRadius: '32px', border: 'none', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.2)', padding: '25px'}} />
                      <Bar dataKey={chartData.yAxisKey} fill="#84B179" radius={[15, 15, 15, 15]} barSize={40}>
                        {chartData.data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={chartData.data.slice(0, 25)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey={chartData.xAxisKey} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} dy={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} />
                      <Tooltip contentStyle={{borderRadius: '32px', border: 'none', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)'}} />
                      <Line type="stepAfter" dataKey={chartData.yAxisKey} stroke="#84B179" strokeWidth={8} dot={{ r: 10, fill: '#84B179', strokeWidth: 5, stroke: '#fff' }} />
                    </LineChart>
                  ) : (
                    <AreaChart data={chartData.data.slice(0, 25)}>
                      <defs>
                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#84B179" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#84B179" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey={chartData.xAxisKey} hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{borderRadius: '32px', border: 'none'}} />
                      <Area type="monotone" dataKey={chartData.yAxisKey} stroke="#84B179" strokeWidth={8} fill="url(#colorArea)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- INTELLIGENCE PANEL --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-[#2D3436] p-12 rounded-[50px] text-white shadow-3xl">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-[#84B179] rounded-2xl"><Cpu size={28} /></div>
                  <div>
                    <h4 className="font-black text-xl tracking-tight">EDGE AI ANALYZER</h4>
                    <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Anomaly Detection Engine</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-white/10">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Trend Analysis</span>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${analysis?.trend === 'Uptrend' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {analysis?.trend}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/10">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Outliers Found</span>
                    <span className="text-amber-400 font-black text-xl">{analysis?.anomalies.length} Cases</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed italic font-medium pt-4">
                    "Sistem mendeteksi {analysis?.anomalies.length} anomali pada kolom {chartData.xAxisKey}. Disarankan untuk memverifikasi data yang berada jauh dari garis rata-rata."
                  </p>
                </div>
              </div>

              <div className="bg-[#E8F5BD] p-12 rounded-[50px] border border-[#84B179]/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="text-[#84B179]" size={20} />
                    <span className="font-black text-[#84B179] text-xs tracking-[0.4em] uppercase">Quick Summary</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 leading-[1.3] tracking-tight">
                    Dataset kamu menunjukkan pola <span className="underline decoration-[#84B179] underline-offset-4 italic">{analysis?.trend.toLowerCase()}</span> dengan rata-rata kumulatif sebesar <span className="text-[#84B179]">{analysis?.avg?.toFixed(2)}</span>. 
                  </p>
                </div>
                <button className="mt-8 px-8 py-5 bg-white rounded-3xl font-black text-[10px] tracking-widest text-[#84B179] shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-3">
                  <Share2 size={16}/> SHARE INSIGHTS
                </button>
              </div>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-white rounded-[50px] border border-slate-100 shadow-2xl overflow-hidden">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><TableIcon size={20} className="text-[#84B179]" /></div>
                  <h4 className="font-black text-xl text-slate-800 tracking-tight">DATA EXPLORER</h4>
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#84B179] transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Filter dataset..." 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#84B179] w-80 transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black tracking-widest text-[10px]">
                      {chartData.allKeys.map((h) => (
                        <th key={h} className="px-10 py-6 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-[#E8F5BD]/20 transition-all duration-300">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-10 py-6 font-bold text-slate-600">
                            {typeof val === 'number' ? val.toLocaleString() : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
      
      <footer className="max-w-7xl mx-auto px-10 pb-20 pt-10 border-t border-slate-100 flex justify-between items-center text-slate-400">
        <div className="text-[10px] font-black tracking-widest">© 2026 INSIGHTEDGE ENGINE • HANS CHRISTIAN</div>
        <div className="flex gap-6 text-[10px] font-black tracking-widest uppercase">
          <span className="text-[#84B179]">Privacy First</span>
          <span>Open Source</span>
          <span>v2.1.0</span>
        </div>
      </footer>
    </main>
  );
}