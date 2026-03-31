import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard, Users, FolderOpen, ChevronRight, Plus,
  Clock, CheckCircle2, AlertTriangle, Film, Calendar, ChevronLeft,
  Edit2, Check, Loader2, Circle, Eye, ArrowLeft, Trash2,
  Search, Bell, Target, ChevronDown, CalendarPlus, CalendarDays,
  ExternalLink, Link2, MessageSquare, X, Save, Pencil, RefreshCw,
  Package, CheckSquare, FileText, Share2, Download
} from "lucide-react";

const SUPABASE_URL = "https://wkmgpjtxkxomphslddjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbWdwanR4a3hvbXBoc2xkZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTgwMjQsImV4cCI6MjA4OTU3NDAyNH0.Z56CarFSTBgkjVvGAOPMW0Q5rTU2YX1Jw6q5ZD9Agqc";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_EDITORS = [
  { id: 1,  name: "นายต้น",      color: "bg-indigo-500"  },
  { id: 2,  name: "นายเก่ง",     color: "bg-violet-500"  },
  { id: 3,  name: "นางสาวบี",    color: "bg-pink-500"    },
  { id: 4,  name: "นายฟ้า",      color: "bg-sky-500"     },
  { id: 5,  name: "นางสาวนุ่น",  color: "bg-emerald-500" },
  { id: 6,  name: "นายอาร์ต",    color: "bg-amber-500"   },
  { id: 7,  name: "นางสาวแพร",   color: "bg-rose-500"    },
  { id: 8,  name: "นายแมค",      color: "bg-teal-500"    },
  { id: 9,  name: "นายปอนด์",    color: "bg-orange-500"  },
  { id: 10, name: "นางสาวจอย",   color: "bg-cyan-500"    },
];
const EDITOR_COLORS = ["bg-indigo-500","bg-violet-500","bg-pink-500","bg-sky-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-teal-500","bg-orange-500","bg-cyan-500","bg-purple-500","bg-lime-500"];
const STATUSES = [
  { value: "pending",     label: "รอดำเนินการ", icon: Circle,       bg: "bg-slate-100 text-slate-600",    dot: "bg-slate-400"   },
  { value: "in_progress", label: "กำลังตัดต่อ", icon: Loader2,      bg: "bg-indigo-100 text-indigo-700",  dot: "bg-indigo-500"  },
  { value: "review",      label: "รอตรวจงาน",   icon: Eye,          bg: "bg-amber-100 text-amber-700",    dot: "bg-amber-400"   },
  { value: "revision",    label: "แก้ไข",        icon: Edit2,        bg: "bg-orange-100 text-orange-700",  dot: "bg-orange-400"  },
  { value: "completed",   label: "เสร็จสิ้น",    icon: CheckCircle2, bg: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500" },
];
const TH_MONTHS       = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const TH_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const TH_DAYS         = ["อา","จ","อ","พ","พฤ","ศ","ส"];
const todayDate = new Date(); todayDate.setHours(0,0,0,0);
function addDays(n) { const d=new Date(todayDate); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; }
function fmtDate(iso) { if(!iso) return "—"; const d=new Date(iso); return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()+543).slice(-2)}`; }
function makeId() { return `id-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }

// ─── Export Excel (SheetJS) ──────────────────────────────────────
async function exportToExcel(projectName, packageName, clips, editors) {
  const statusLabel = {pending:"รอดำเนินการ",in_progress:"กำลังตัดต่อ",review:"รอตรวจงาน",revision:"แก้ไข",completed:"เสร็จสิ้น"};
  const statusColor = {pending:"FFE2E8F0",in_progress:"FFE0E7FF",review:"FFFEF3C7",revision:"FFFED7AA",completed:"FFD1FAE5"};

  // Load SheetJS dynamically
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;

  const sortedClips = [...clips].sort((a,b) => (a.sort_order||999) - (b.sort_order||999));
  const wb = XLSX.utils.book_new();
  const wsData = [
    [`ตารางส่งงาน: ${projectName} — ${packageName}`],
    [],
    ["ลำดับ","ชื่อคลิป","คนตัดต่อ","Deadline","สถานะตัดต่อ"],
    ...sortedClips.map((c,i) => {
      const editor = editors.find(e => e.id === c.editor_id);
      return [i+1, c.name, editor?editor.name:"ไม่ระบุ", c.deadline||"", statusLabel[c.status]||c.status];
    })
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [{wch:6},{wch:45},{wch:15},{wch:14},{wch:16}];

  // Merge title row
  ws["!merges"] = [{s:{r:0,c:0},e:{r:0,c:4}}];

  // Style helper
  const titleStyle = {font:{bold:true,sz:14,color:{rgb:"FF4338CA"}},alignment:{horizontal:"center"}};
  const headerStyle = {font:{bold:true,color:{rgb:"FFFFFFFF"}},fill:{fgColor:{rgb:"FF4338CA"}},alignment:{horizontal:"center",vertical:"center"},border:{bottom:{style:"thin",color:{rgb:"FF6366F1"}}}};
  const cellStyle = {alignment:{vertical:"center",wrapText:true},border:{bottom:{style:"thin",color:{rgb:"FFE2E8F0"}}}};

  // Apply title style
  if(ws["A1"]) ws["A1"].s = titleStyle;

  // Apply header styles row 3 (index 2)
  ["A3","B3","C3","D3","E3"].forEach(cell => {
    if(ws[cell]) ws[cell].s = headerStyle;
  });

  // Apply data row styles with status colors
  sortedClips.forEach((_,i) => {
    const row = i + 4; // data starts row 4
    const st = sortedClips[i]?.status||"pending";
    const bgColor = statusColor[st]||"FFFFFFFF";
    ["A","B","C","D","E"].forEach(col => {
      const ref = col+row;
      if(ws[ref]) ws[ref].s = {...cellStyle, fill:{fgColor:{rgb:bgColor}}};
    });
  });

  ws["!rows"] = [{hpt:30},{hpt:4},{hpt:22}];

  XLSX.utils.book_append_sheet(wb, ws, packageName.slice(0,31));
  XLSX.writeFile(wb, `${projectName}_${packageName}_ตารางส่งงาน.xlsx`);
}

function openGCal(title,date,details) { const s=(date||"").replace(/-/g,""); const d=new Date(date); d.setDate(d.getDate()+1); const e=d.toISOString().split("T")[0].replace(/-/g,""); const p=new URLSearchParams({action:"TEMPLATE",text:title,dates:`${s}/${e}`,details:details||"",sf:"true",output:"xml"}); window.open(`https://calendar.google.com/calendar/render?${p}`,"_blank"); }

function getProgress(clips) {
  if (!clips.length) return 0;
  const score = clips.reduce((sum,c) => {
    if (c.status==="completed")   return sum+100;
    if (c.status==="review")      return sum+80;
    if (c.status==="revision")    return sum+50;
    if (c.status==="in_progress") return sum+30;
    return sum;
  },0);
  return Math.round(score/clips.length);
}

// ─── UI Atoms ────────────────────────────────────────────────────
function Avatar({editor,size}) {
  if(!editor) return <span className="text-slate-400 text-xs italic">ไม่ระบุ</span>;
  const sz=size==="lg"?"w-12 h-12 text-base":size==="md"?"w-9 h-9 text-sm":"w-7 h-7 text-xs";
  const initials=editor.name.replace(/^(นาย|นางสาว|นาง)/,"").slice(0,2);
  return <div className={`${sz} ${editor.color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>{initials}</div>;
}
function StatusBadge({status}) {
  const s=STATUSES.find(x=>x.value===status)||STATUSES[0]; const Icon=s.icon;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}><Icon size={11} className={status==="in_progress"?"animate-spin":""}/>{s.label}</span>;
}
function ProgressBar({value}) {
  return <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${value===100?"bg-emerald-500":"bg-indigo-500"}`} style={{width:`${value}%`}}/></div>;
}

// ─── Date Picker ─────────────────────────────────────────────────
function DatePicker({value,onChange,placeholder}) {
  const [open,setOpen]=useState(false);
  const [mode,setMode]=useState("days");
  const [viewYear,setViewYear]=useState(()=>value?new Date(value).getFullYear():todayDate.getFullYear());
  const [viewMonth,setViewMonth]=useState(()=>value?new Date(value).getMonth():todayDate.getMonth());
  const ref=useRef(null);
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target)){setOpen(false);setMode("days");}} document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  useEffect(()=>{if(value){setViewYear(new Date(value).getFullYear());setViewMonth(new Date(value).getMonth());}},[value]);
  const selected=value?new Date(value):null;
  const firstDay=new Date(viewYear,viewMonth,1).getDay();
  const daysInM=new Date(viewYear,viewMonth+1,0).getDate();
  const cells=Array.from({length:firstDay},()=>null).concat(Array.from({length:daysInM},(_,i)=>i+1));
  function pick(day){onChange(new Date(viewYear,viewMonth,day).toISOString().split("T")[0]);setOpen(false);setMode("days");}
  function isTod(d){return new Date(viewYear,viewMonth,d).toDateString()===todayDate.toDateString();}
  function isSel(d){return selected&&new Date(viewYear,viewMonth,d).toDateString()===selected.toDateString();}
  function prev(){if(mode==="days"){viewMonth===0?(setViewMonth(11),setViewYear(y=>y-1)):setViewMonth(m=>m-1);}else if(mode==="months")setViewYear(y=>y-1);else setViewYear(y=>y-12);}
  function next(){if(mode==="days"){viewMonth===11?(setViewMonth(0),setViewYear(y=>y+1)):setViewMonth(m=>m+1);}else if(mode==="months")setViewYear(y=>y+1);else setViewYear(y=>y+12);}
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors">
        <Calendar size={14} className="text-indigo-400 shrink-0"/>
        <span className={`flex-1 text-left truncate ${value?"text-slate-700":"text-slate-400"}`}>{value?fmtDate(value):(placeholder||"เลือกวันที่")}</span>
        <ChevronDown size={13} className="text-slate-400 shrink-0"/>
      </button>
      {open&&(
        <div className="absolute z-50 mt-2 left-0 bg-white border border-slate-200 rounded-2xl shadow-2xl w-72 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500"><ChevronLeft size={15}/></button>
            <div className="flex items-center gap-1">
              {mode!=="months"&&<button onClick={()=>setMode(m=>m==="days"?"months":"days")} className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50">{TH_MONTHS[viewMonth]}</button>}
              <button onClick={()=>setMode(m=>m==="years"?"days":"years")} className="text-sm font-bold text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50">{viewYear+543}</button>
            </div>
            <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500"><ChevronRight size={15}/></button>
          </div>
          {mode==="years"&&<div className="grid grid-cols-4 gap-1 p-3">{Array.from({length:12},(_,i)=>viewYear-5+i).map(y=><button key={y} onClick={()=>{setViewYear(y);setMode("months");}} className={`py-2.5 rounded-xl text-sm font-medium ${y===viewYear?"bg-indigo-600 text-white":"hover:bg-indigo-50 text-slate-700"}`}>{y+543}</button>)}</div>}
          {mode==="months"&&<div className="grid grid-cols-3 gap-1 p-3">{TH_MONTHS_SHORT.map((m,i)=><button key={i} onClick={()=>{setViewMonth(i);setMode("days");}} className={`py-2.5 rounded-xl text-sm font-medium ${i===viewMonth?"bg-indigo-600 text-white":"hover:bg-indigo-50 text-slate-700"}`}>{m}</button>)}</div>}
          {mode==="days"&&<div className="p-3">
            <div className="grid grid-cols-7 mb-1.5">{TH_DAYS.map((d,i)=><div key={d} className={`text-center text-xs font-semibold py-1 ${i===0?"text-red-400":i===6?"text-blue-400":"text-slate-400"}`}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-0.5">{cells.map((day,i)=><div key={i}>{day?<button onClick={()=>pick(day)} className={`w-full aspect-square rounded-xl text-sm font-medium flex items-center justify-center ${isSel(day)?"bg-indigo-600 text-white":isTod(day)?"bg-indigo-100 text-indigo-700 font-bold ring-2 ring-indigo-300":"hover:bg-slate-100 text-slate-700"}`}>{day}</button>:<div/>}</div>)}</div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <button onClick={()=>{onChange(todayDate.toISOString().split("T")[0]);setOpen(false);}} className="text-xs text-indigo-600 hover:underline font-semibold">วันนี้</button>
              {value&&<button onClick={()=>{onChange("");setOpen(false);}} className="text-xs text-slate-400 hover:text-red-500">ล้างค่า</button>}
            </div>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── GCal Modal ──────────────────────────────────────────────────
function GCalModal({project,editors,onClose}) {
  const allClips=project.packages?.flatMap(pk=>pk.clips)||[];
  const pending=allClips.filter(c=>c.status!=="completed");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2"><CalendarDays size={18} className="text-blue-500"/><h2 className="font-bold text-slate-800 text-sm">ส่งออกไป Google Calendar</h2></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500"><X size={16}/></button>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 mb-4">โปรเจกต์: <span className="font-semibold text-slate-700">{project.client}</span></p>
          {pending.length===0?<div className="py-8 text-center"><CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2"/><p className="text-sm text-slate-400">งานทุกชิ้นเสร็จสิ้นแล้ว</p></div>:(
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pending.map(clip=>{
                const editor=editors.find(e=>e.id===clip.editor_id);
                const isOver=new Date(clip.deadline)<todayDate;
                const details=`[Digicon Team]\nโปรเจกต์: ${project.client}\nคนตัดต่อ: ${editor?editor.name:"ไม่ระบุ"}\nสถานะ: ${STATUSES.find(s=>s.value===clip.status)?.label}`;
                return (
                  <div key={clip.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p><p className={`text-xs mt-0.5 ${isOver?"text-red-500":"text-slate-400"}`}>Deadline: {fmtDate(clip.deadline)}{isOver?" ⚠":""}</p></div>
                    <button onClick={()=>openGCal(`[Digicon] ${clip.name}`,clip.deadline,details)} className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-600 font-medium"><CalendarPlus size={13}/>สร้าง</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-400">เหลืองาน {pending.length} รายการ</p>
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 rounded-xl">ปิด</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({message,onConfirm,onCancel}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <p className="text-slate-700 font-medium mb-5 text-center">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-5 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">ยกเลิก</button>
          <button onClick={onConfirm} className="px-5 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded-xl font-medium">ลบ</button>
        </div>
      </div>
    </div>
  );
}

// ─── Todo Panel ──────────────────────────────────────────────────
function TodoPanel({selDay}) {
  const [todos,setTodos]=useState([]);
  const [newText,setNewText]=useState("");
  const [loading,setLoading]=useState(false);
  const dateStr=selDay?selDay.toISOString().split("T")[0]:todayDate.toISOString().split("T")[0];
  const displayDate=selDay||todayDate;

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);
      const {data,error}=await db.from("todos").select("*").eq("date",dateStr).order("created_at");
      if(!cancelled){
        setTodos(data||[]);
        setLoading(false);
      }
    }
    load();
    // Realtime subscription for todos
    const ch=db.channel(`todos-${dateStr}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"todos",filter:`date=eq.${dateStr}`},({new:r})=>{
        setTodos(p=>[...p.filter(t=>t.id!==r.id),r].sort((a,b)=>a.created_at>b.created_at?1:-1));
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"todos",filter:`date=eq.${dateStr}`},({new:r})=>{
        setTodos(p=>p.map(t=>t.id===r.id?r:t));
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"todos"},({old:r})=>{
        setTodos(p=>p.filter(t=>t.id!==r.id));
      })
      .subscribe();
    return()=>{cancelled=true;db.removeChannel(ch);};
  },[dateStr]);

  async function addTodo(){
    if(!newText.trim())return;
    const todo={id:makeId(),date:dateStr,text:newText.trim(),done:false,created_at:new Date().toISOString()};
    setTodos(p=>[...p,todo]);
    setNewText("");
    await db.from("todos").insert(todo);
  }
  async function toggleTodo(id,done){
    setTodos(p=>p.map(t=>t.id===id?{...t,done:!done}:t));
    await db.from("todos").update({done:!done}).eq("id",id);
  }
  async function deleteTodo(id){
    setTodos(p=>p.filter(t=>t.id!==id));
    await db.from("todos").delete().eq("id",id);
  }

  const doneCnt=todos.filter(t=>t.done).length;
  const isToday=displayDate.toDateString()===todayDate.toDateString();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <CheckSquare size={14} className="text-violet-500"/>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-700 truncate">
            {isToday?"To-do วันนี้":`To-do ${displayDate.getDate()} ${TH_MONTHS_SHORT[displayDate.getMonth()]}`}
          </h3>
        </div>
        {todos.length>0&&(
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doneCnt===todos.length?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500"}`}>
            {doneCnt}/{todos.length}
          </span>
        )}
      </div>
      {/* Input */}
      <div className="px-3 py-2.5 border-b border-slate-100 flex gap-2">
        <input
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-slate-50"
          placeholder="เพิ่ม task..."
          value={newText}
          onChange={e=>setNewText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addTodo()}
        />
        <button onClick={addTodo} className="w-8 h-8 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white shrink-0 transition-colors">
          <Plus size={15}/>
        </button>
      </div>
      {/* List */}
      <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
        {loading&&<div className="py-6 text-center"><p className="text-xs text-slate-400">กำลังโหลด...</p></div>}
        {!loading&&todos.length===0&&(
          <div className="py-8 text-center">
            <CheckSquare size={24} className="text-slate-200 mx-auto mb-2"/>
            <p className="text-xs text-slate-400">ยังไม่มี task วันนี้</p>
          </div>
        )}
        {todos.map(todo=>(
          <div key={todo.id} className={`px-3 py-2.5 flex items-center gap-2.5 group transition-colors ${todo.done?"bg-slate-50":""}`}>
            <button onClick={()=>toggleTodo(todo.id,todo.done)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${todo.done?"bg-emerald-500 border-emerald-500":"border-slate-300 hover:border-violet-400"}`}>
              {todo.done&&<Check size={11} className="text-white"/>}
            </button>
            <span className={`flex-1 text-sm leading-snug ${todo.done?"line-through text-slate-400":"text-slate-700"}`}>{todo.text}</span>
            <button onClick={()=>deleteTodo(todo.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-500 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={12}/>
            </button>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      {todos.length>0&&(
        <div className="px-3 py-2.5 border-t border-slate-100">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{width:`${Math.round(doneCnt/todos.length*100)}%`}}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────
function CalendarView({allClips,editors}) {
  const [calYear,setCalYear]=useState(todayDate.getFullYear());
  const [calMonth,setCalMonth]=useState(todayDate.getMonth());
  const [selDay,setSelDay]=useState(null);
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const daysInM=new Date(calYear,calMonth+1,0).getDate();
  const prevM=new Date(calYear,calMonth,0).getDate();
  const cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:prevM-i,cur:false});
  for(let i=1;i<=daysInM;i++)cells.push({day:i,cur:true});
  for(let i=1;i<=42-cells.length;i++)cells.push({day:i,cur:false});
  function clipsOn(day,cur){if(!cur)return[];const ds=new Date(calYear,calMonth,day).toISOString().split("T")[0];return allClips.filter(c=>c.deadline===ds);}
  function isTod(d,c){return c&&new Date(calYear,calMonth,d).toDateString()===todayDate.toDateString();}
  function isSel(d,c){return c&&selDay&&new Date(calYear,calMonth,d).toDateString()===selDay.toDateString();}
  const selClips=selDay?allClips.filter(c=>c.deadline===selDay.toISOString().split("T")[0]):[];
  function prevMo(){calMonth===0?(setCalMonth(11),setCalYear(y=>y-1)):setCalMonth(m=>m-1);}
  function nextMo(){calMonth===11?(setCalMonth(0),setCalYear(y=>y+1)):setCalMonth(m=>m+1);}
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-800">ปฏิทิน Deadline</h1><p className="text-slate-500 text-sm mt-1">คลิกวันที่เพื่อดูงานและ To-do</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={prevMo} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500"><ChevronLeft size={18}/></button>
            <h2 className="font-bold text-slate-800">{TH_MONTHS[calMonth]} {calYear+543}</h2>
            <button onClick={nextMo} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500"><ChevronRight size={18}/></button>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100">{TH_DAYS.map((d,i)=><div key={d} className={`text-center py-2.5 text-xs font-semibold ${i===0?"text-red-400":i===6?"text-blue-400":"text-slate-400"}`}>{d}</div>)}</div>
          <div className="grid grid-cols-7">
            {cells.map((cell,idx)=>{
              const clips=clipsOn(cell.day,cell.cur);const sel=isSel(cell.day,cell.cur);const tod=isTod(cell.day,cell.cur);const col=idx%7;
              return(<div key={idx} onClick={()=>{if(!cell.cur)return;const d=new Date(calYear,calMonth,cell.day);setSelDay(sel?null:d);}}
                className={`min-h-16 p-1.5 border-b border-r border-slate-100 transition-colors ${col===6?"border-r-0":""} ${!cell.cur?"bg-slate-50/60":sel?"bg-indigo-50":"hover:bg-slate-50 cursor-pointer"}`}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold mb-1 mx-auto ${tod?"bg-indigo-600 text-white":sel?"bg-indigo-100 text-indigo-700":cell.cur?(col===0?"text-red-400":col===6?"text-blue-400":"text-slate-700"):"text-slate-300"}`}>{cell.day}</div>
                {cell.cur&&clips.length>0&&<div className="space-y-0.5">{clips.slice(0,2).map(c=>{const st=STATUSES.find(s=>s.value===c.status);return<div key={c.id} className={`text-xs px-1.5 py-0.5 rounded-md truncate font-medium leading-tight ${st.bg}`}>{c.name.length>9?c.name.slice(0,9)+"…":c.name}</div>;})}
                {clips.length>2&&<div className="text-xs text-center text-slate-400">+{clips.length-2}</div>}</div>}
              </div>);
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">สถานะงาน</h3>
            <div className="space-y-2.5">{STATUSES.map(s=><div key={s.value} className="flex items-center gap-2.5"><div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`}/><span className="text-sm text-slate-600 flex-1">{s.label}</span><span className="text-sm font-bold text-slate-700">{allClips.filter(c=>c.status===s.value).length}</span></div>)}</div>
          </div>
          {/* To-do Panel */}
          <TodoPanel selDay={selDay}/>
          {/* งานวันที่เลือก */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500"/>
              <h3 className="text-sm font-semibold text-slate-700 flex-1 truncate">{selDay?`${selDay.getDate()} ${TH_MONTHS[selDay.getMonth()]} ${selDay.getFullYear()+543}`:"คลิกวันที่เพื่อดูงาน"}</h3>
              {selClips.length>0&&<span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{selClips.length}</span>}
            </div>
            {!selDay?<div className="py-8 text-center"><Calendar size={24} className="text-slate-200 mx-auto mb-2"/><p className="text-slate-400 text-xs">เลือกวันจากปฏิทิน</p></div>
            :selClips.length===0?<div className="py-8 text-center"><CheckCircle2 size={24} className="text-emerald-300 mx-auto mb-2"/><p className="text-slate-400 text-xs">ไม่มีงานวันนี้</p></div>
            :<div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">{selClips.map(clip=>{const editor=editors.find(e=>e.id===clip.editor_id);return<div key={clip.id} className="px-4 py-3 flex items-start gap-2"><Avatar editor={editor} size="sm"/><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p><p className="text-xs text-slate-400 truncate">{clip.projectName}</p><div className="mt-1"><StatusBadge status={clip.status}/></div></div></div>;})}</div>}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-700">งาน 7 วันข้างหน้า</h3></div>
            <div className="divide-y divide-slate-100">{Array.from({length:7},(_,i)=>{const d=new Date(todayDate);d.setDate(d.getDate()+i);const ds=d.toISOString().split("T")[0];const clips=allClips.filter(c=>c.deadline===ds&&c.status!=="completed");if(!clips.length)return null;return<div key={i} className="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50" onClick={()=>setSelDay(d)}><div className={`w-9 text-center shrink-0 ${i===0?"text-indigo-600":"text-slate-500"}`}><div className="text-xs text-slate-400">{TH_DAYS[d.getDay()]}</div><div className="text-base font-bold leading-tight">{d.getDate()}</div></div><div className="flex-1 min-w-0 flex flex-wrap gap-1">{clips.slice(0,2).map(c=>{const st=STATUSES.find(s=>s.value===c.status);return<span key={c.id} className={`text-xs px-1.5 py-0.5 rounded-full ${st.bg}`}>{c.name.slice(0,12)}{c.name.length>12?"…":""}</span>;})}{clips.length>2&&<span className="text-xs text-slate-400 self-center">+{clips.length-2}</span>}</div></div>;}).filter(Boolean)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════
export default function App() {
  const [projects,setProjects]=useState([]);
  const [editors,setEditors]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [view,setView]=useState("dashboard");
  const [selProj,setSelProj]=useState(null);
  const [selPkg,setSelPkg]=useState(null);
  const [selEditor,setSelEditor]=useState(null);
  const [gcalModal,setGcalModal]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [editingClip,setEditingClip]=useState(null);
  const [addingClip,setAddingClip]=useState(false);
  const [newClip,setNewClip]=useState({name:"",editorId:"",deadline:"",status:"pending",note:"",link:""});
  const [addingProj,setAddingProj]=useState(false);
  const [editingProj,setEditingProj]=useState(null);
  const [editProjData,setEditProjData]=useState({});
  const [newProj,setNewProj]=useState({client:"",pm:"",broker:""});
  const [addingPkg,setAddingPkg]=useState(false);
  const [newPkg,setNewPkg]=useState({name:"แพคเกจ 15 คลิป",total_clips:15});
  const [editingPkg,setEditingPkg]=useState(null);
  const [editPkgData,setEditPkgData]=useState({});
  const [editingEditorId,setEditingEditorId]=useState(null);
  const [editEditorName,setEditEditorName]=useState("");
  const [search,setSearch]=useState("");

  // ── Load data ─────────────────────────────────────────────────
  const loadData=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true);
    try {
      const [{data:editorsData},{data:projectsData},{data:packagesData},{data:clipsData}]=await Promise.all([
        db.from("editors").select("*").order("id"),
        db.from("projects").select("*").order("created_at"),
        db.from("packages").select("*").order("created_at"),
        db.from("clips").select("*").order("sort_order"),
      ]);
      if(!editorsData||editorsData.length===0){await db.from("editors").insert(DEFAULT_EDITORS);setEditors(DEFAULT_EDITORS);}
      else setEditors(editorsData);
      // Merge: project → packages → clips
      const projsWithData=(projectsData||[]).map(p=>{
        const pkgs=(packagesData||[]).filter(pk=>pk.project_id===p.id).map(pk=>({
          ...pk,
          clips:(clipsData||[]).filter(c=>c.package_id===pk.id)
        }));
        // Legacy: clips ที่ยังไม่มี package_id → ใส่ใน package แรก
        const orphanClips=(clipsData||[]).filter(c=>c.project_id===p.id&&!c.package_id);
        if(orphanClips.length>0&&pkgs.length>0){pkgs[0].clips=[...pkgs[0].clips,...orphanClips];}
        return {...p,packages:pkgs};
      });
      setProjects(projsWithData);
    } catch(err){console.error("Load error:",err);}
    if(!silent)setLoading(false);
  },[]);

  useEffect(()=>{loadData();},[loadData]);

  // ── Realtime ──────────────────────────────────────────────────
  useEffect(()=>{
    const ch=db.channel("digicon-rt")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"projects"},({new:r})=>{setProjects(p=>[...p,{...r,packages:[]}]);})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"projects"},({new:r})=>{setProjects(p=>p.map(x=>x.id===r.id?{...x,...r}:x));})
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"projects"},({old:r})=>{setProjects(p=>p.filter(x=>x.id!==r.id));})
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"packages"},({new:r})=>{setProjects(p=>p.map(x=>x.id===r.project_id?{...x,packages:[...x.packages,{...r,clips:[]}]}:x));})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"packages"},({new:r})=>{setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>pk.id===r.id?{...pk,...r}:pk)})));})
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"packages"},({old:r})=>{setProjects(p=>p.map(x=>({...x,packages:x.packages.filter(pk=>pk.id!==r.id)})));})
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"clips"},({new:r})=>{setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>pk.id===r.package_id?{...pk,clips:[...pk.clips.filter(c=>c.id!==r.id),r]}:pk)})));})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"clips"},({new:r})=>{setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>pk.id===r.package_id?{...pk,clips:pk.clips.map(c=>c.id===r.id?r:c)}:pk)})));})
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"clips"},({old:r})=>{setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>({...pk,clips:pk.clips.filter(c=>c.id!==r.id)}))})));})
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"editors"},({new:r})=>{setEditors(p=>[...p.filter(e=>e.id!==r.id),r].sort((a,b)=>a.id-b.id));})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"editors"},({new:r})=>{setEditors(p=>p.map(e=>e.id===r.id?r:e));})
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"editors"},({old:r})=>{setEditors(p=>p.filter(e=>e.id!==r.id));})
      .subscribe();
    return()=>db.removeChannel(ch);
  },[]);

  // ── Computed ──────────────────────────────────────────────────
  const allClips=useMemo(()=>projects.flatMap(p=>p.packages.flatMap(pk=>pk.clips.map(c=>({...c,projectId:p.id,projectName:p.client,packageName:pk.name})))),[projects]);
  const overdue=allClips.filter(c=>c.status!=="completed"&&new Date(c.deadline)<todayDate);
  const dueSoon=allClips.filter(c=>{const diff=(new Date(c.deadline)-todayDate)/86400000;return c.status!=="completed"&&diff>=0&&diff<=2;});
  const awaitReview=allClips.filter(c=>c.status==="review");
  const dueToday=allClips.filter(c=>new Date(c.deadline).toDateString()===todayDate.toDateString()&&c.status!=="completed");

  // ── Project CRUD ──────────────────────────────────────────────
  async function handleAddProj(){
    if(!newProj.client.trim())return;
    const proj={id:makeId(),client:newProj.client,pm:newProj.pm,broker:newProj.broker,created_at:new Date().toISOString().split("T")[0],packages:[]};
    setProjects(p=>[...p,proj]);
    setNewProj({client:"",pm:"",broker:""});setAddingProj(false);
    const{packages:_,...projData}=proj;
    await db.from("projects").insert(projData);
  }
  async function saveEditProj(){
    setProjects(p=>p.map(x=>x.id===editingProj?{...x,...editProjData}:x));
    setEditingProj(null);
    await db.from("projects").update({client:editProjData.client,pm:editProjData.pm,broker:editProjData.broker}).eq("id",editingProj);
  }
  async function deleteProj(id){
    setProjects(p=>p.filter(x=>x.id!==id));
    if(selProj&&selProj.id===id){setSelProj(null);setSelPkg(null);setView("management");}
    setConfirmDel(null);
    await db.from("projects").delete().eq("id",id);
  }

  // ── Package CRUD ──────────────────────────────────────────────
  async function handleAddPkg(){
    if(!newPkg.name.trim())return;
    const pkg={id:makeId(),project_id:selProj.id,name:newPkg.name,total_clips:parseInt(newPkg.total_clips)||15,status:"active",created_at:new Date().toISOString().split("T")[0],clips:[]};
    setProjects(p=>p.map(x=>x.id===selProj.id?{...x,packages:[...x.packages,pkg]}:x));
    setNewPkg({name:"แพคเกจ 15 คลิป",total_clips:15});setAddingPkg(false);
    const{clips:_,...pkgData}=pkg;
    await db.from("packages").insert(pkgData);
  }
  async function saveEditPkg(){
    setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>pk.id===editingPkg?{...pk,...editPkgData}:pk)})));
    setEditingPkg(null);
    await db.from("packages").update({name:editPkgData.name,total_clips:parseInt(editPkgData.total_clips)||15}).eq("id",editingPkg);
  }
  async function deletePkg(id){
    setProjects(p=>p.map(x=>({...x,packages:x.packages.filter(pk=>pk.id!==id)})));
    if(selPkg&&selPkg.id===id){setSelPkg(null);setView("project");}
    setConfirmDel(null);
    await db.from("packages").delete().eq("id",id);
  }
  async function togglePkgDone(pkg){
    const newStatus=pkg.status==="done"?"active":"done";
    setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>pk.id===pkg.id?{...pk,status:newStatus}:pk)})));
    await db.from("packages").update({status:newStatus}).eq("id",pkg.id);
  }

  // ── Clip CRUD ─────────────────────────────────────────────────
  async function updateClip(cid,changes){
    setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>({...pk,clips:pk.clips.map(c=>c.id===cid?{...c,...changes}:c)}))})));
    await db.from("clips").update(changes).eq("id",cid);
  }
  async function deleteClip(cid){
    setProjects(p=>p.map(x=>({...x,packages:x.packages.map(pk=>({...pk,clips:pk.clips.filter(c=>c.id!==cid)}))})));
    setConfirmDel(null);
    await db.from("clips").delete().eq("id",cid);
  }
  async function handleAddClip(){
    if(!newClip.name.trim())return;
    const maxOrder = currentPkg.clips.length > 0 ? Math.max(...currentPkg.clips.map(c=>c.sort_order||0)) : 0;
    const clip={id:makeId(),project_id:currentProject.id,package_id:currentPkg.id,name:newClip.name,editor_id:newClip.editorId?parseInt(newClip.editorId):null,deadline:newClip.deadline||addDays(7),status:newClip.status||"pending",note:newClip.note||"",link:newClip.link||"",sort_order:maxOrder+1};
    setProjects(p=>p.map(x=>x.id===currentProject.id?{...x,packages:x.packages.map(pk=>pk.id===currentPkg.id?{...pk,clips:[...pk.clips,clip]}:pk)}:x));
    setNewClip({name:"",editorId:"",deadline:"",status:"pending",note:"",link:""});setAddingClip(false);
    await db.from("clips").insert(clip);
  }

  // ── Editor CRUD ───────────────────────────────────────────────
  async function saveEditorName(id){
    if(!editEditorName.trim()){setEditingEditorId(null);return;}
    setEditors(p=>p.map(e=>e.id===id?{...e,name:editEditorName.trim()}:e));
    setEditingEditorId(null);
    await db.from("editors").update({name:editEditorName.trim()}).eq("id",id);
  }
  async function addEditor(){
    const color=EDITOR_COLORS[editors.length%EDITOR_COLORS.length];
    const newId=Math.max(...editors.map(e=>e.id),0)+1;
    const newEd={id:newId,name:`คนตัดต่อใหม่ ${newId}`,color};
    setEditors(p=>[...p,newEd]);
    await db.from("editors").insert(newEd);
    setEditingEditorId(newId);setEditEditorName(newEd.name);
  }
  async function deleteEditor(id){
    setEditors(p=>p.filter(e=>e.id!==id));
    setConfirmDel(null);
    await db.from("editors").delete().eq("id",id);
  }

  const currentProject=selProj?projects.find(p=>p.id===selProj.id):null;
  const currentPkg=selPkg&&currentProject?currentProject.packages.find(pk=>pk.id===selPkg.id):null;

  const navItems=[
    {id:"dashboard",label:"แดชบอร์ด",icon:LayoutDashboard},
    {id:"calendar",label:"ปฏิทิน",icon:Calendar},
    {id:"management",label:"จัดการงาน",icon:FolderOpen},
    {id:"editors",label:"ทีมงาน",icon:Users},
  ];
  function navGo(id){setView(id);setSelProj(null);setSelPkg(null);setSelEditor(null);setEditingClip(null);}
  function isActive(id){return view===id||(id==="management"&&(view==="project"||view==="package"))||(id==="editors"&&view==="editor");}

  if(loading) return(
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Film size={24} className="text-white animate-pulse"/></div>
        <p className="text-slate-500 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {gcalModal&&<GCalModal project={gcalModal} editors={editors} onClose={()=>setGcalModal(null)}/>}
      {confirmDel&&<ConfirmDialog
        message={confirmDel.type==="clip"?"ลบคลิปนี้?":confirmDel.type==="project"?"ลบโปรเจกต์นี้ทั้งหมด?":confirmDel.type==="package"?"ลบแพคเกจนี้?":"ลบคนตัดต่อคนนี้?"}
        onConfirm={()=>{if(confirmDel.type==="clip")deleteClip(confirmDel.id);else if(confirmDel.type==="project")deleteProj(confirmDel.id);else if(confirmDel.type==="package")deletePkg(confirmDel.id);else deleteEditor(confirmDel.id);}}
        onCancel={()=>setConfirmDel(null)}/>}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center"><Film size={16} className="text-white"/></div>
            <div className="leading-none"><span className="font-black text-slate-800 text-base tracking-tight">Digicon</span><span className="font-black text-indigo-500 text-base tracking-tight"> Team</span></div>
            {saving&&<RefreshCw size={13} className="text-indigo-400 animate-spin ml-1"/>}
          </div>
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(item=>{const Icon=item.icon;return<button key={item.id} onClick={()=>navGo(item.id)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${isActive(item.id)?"bg-indigo-50 text-indigo-700":"text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}><Icon size={15}/>{item.label}</button>;})}
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="ค้นหา..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 text-sm bg-slate-100 border-0 rounded-xl w-36 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"/></div>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><Bell size={16} className="text-slate-500"/>{(overdue.length+awaitReview.length)>0&&<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/>}</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">

        {/* ═══ DASHBOARD ═══ */}
        {view==="dashboard"&&(
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-slate-800">สวัสดี, ทีม Digicon</h1><p className="text-slate-400 text-sm mt-1">{todayDate.getDate()} {TH_MONTHS[todayDate.getMonth()]} {todayDate.getFullYear()+543}</p></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{label:"งานเลยกำหนด",value:overdue.length,icon:AlertTriangle,color:"text-red-500",bg:"bg-red-50",border:"border-red-100"},{label:"ส่งใน 2 วัน",value:dueSoon.length,icon:Clock,color:"text-amber-500",bg:"bg-amber-50",border:"border-amber-100"},{label:"รอตรวจงาน",value:awaitReview.length,icon:Eye,color:"text-indigo-500",bg:"bg-indigo-50",border:"border-indigo-100"},{label:"คลิปทั้งหมด",value:allClips.length,icon:Film,color:"text-slate-500",bg:"bg-slate-50",border:"border-slate-200"}].map(card=>{const Icon=card.icon;return<div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4 flex flex-col gap-3`}><Icon size={20} className={card.color}/><div><div className="text-3xl font-bold text-slate-800">{card.value}</div><div className="text-xs text-slate-500 mt-0.5">{card.label}</div></div></div>;})}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"><Target size={16} className="text-indigo-500"/><h2 className="font-semibold text-slate-800 text-sm">งานที่ต้องส่งวันนี้</h2><span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{dueToday.length}</span></div>
              {dueToday.length===0?<div className="py-12 text-center"><CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3"/><p className="text-slate-400 text-sm">ไม่มีงานที่ต้องส่งวันนี้</p></div>:(
                <div className="divide-y divide-slate-50">{dueToday.map(clip=>{const editor=editors.find(e=>e.id===clip.editor_id);return<div key={clip.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 flex-wrap"><Avatar editor={editor} size="sm"/><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p><p className="text-xs text-slate-400 truncate">{clip.projectName}</p></div><StatusBadge status={clip.status}/></div>;})}</div>
              )}
            </div>
            {overdue.length>0&&(
              <div className="bg-red-50 border border-red-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/><h2 className="font-semibold text-red-700 text-sm">งานเลยกำหนด ({overdue.length} รายการ)</h2></div>
                <div className="divide-y divide-red-100">{overdue.slice(0,5).map(clip=>{const editor=editors.find(e=>e.id===clip.editor_id);const days=Math.round((todayDate-new Date(clip.deadline))/86400000);return<div key={clip.id} className="px-5 py-3.5 flex items-center gap-3 flex-wrap"><Avatar editor={editor} size="sm"/><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p><p className="text-xs text-red-500">เลยกำหนด {days} วัน · {clip.projectName}</p></div><StatusBadge status={clip.status}/></div>;})}</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALENDAR ═══ */}
        {view==="calendar"&&<CalendarView allClips={allClips} editors={editors}/>}

        {/* ═══ MANAGEMENT — Project List ═══ */}
        {view==="management"&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold text-slate-800">จัดการโปรเจกต์</h1><p className="text-slate-500 text-sm mt-1">{projects.length} ลูกค้า · {allClips.length} คลิป</p></div>
              <button onClick={()=>setAddingProj(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-2xl"><Plus size={16}/><span className="hidden sm:inline">เพิ่มลูกค้า</span></button>
            </div>
            {addingProj&&(
              <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 text-sm">เพิ่มลูกค้าใหม่</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[{k:"client",l:"ชื่อลูกค้า / บริษัท",ph:"เช่น บริษัท ABC จำกัด"},{k:"pm",l:"Project Manager",ph:"ชื่อ PM"},{k:"broker",l:"นายหน้า",ph:"ชื่อนายหน้า"}].map(f=><div key={f.k}><label className="block text-xs text-slate-500 mb-1">{f.l}</label><input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder={f.ph} value={newProj[f.k]} onChange={e=>setNewProj(p=>({...p,[f.k]:e.target.value}))}/></div>)}
                </div>
                <div className="flex gap-2 justify-end"><button onClick={()=>setAddingProj(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">ยกเลิก</button><button onClick={handleAddProj} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium">บันทึก</button></div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.filter(p=>!search||p.client.toLowerCase().includes(search.toLowerCase())).map(project=>{
                const allProjClips=project.packages.flatMap(pk=>pk.clips);
                const progress=getProgress(allProjClips);
                const pOver=allProjClips.filter(c=>c.status!=="completed"&&new Date(c.deadline)<todayDate);
                const isEditP=editingProj===project.id;
                return(
                  <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all group">
                    {isEditP?(
                      <div className="space-y-2 mb-3">
                        {[{k:"client",l:"ชื่อลูกค้า"},{k:"pm",l:"PM"},{k:"broker",l:"นายหน้า"}].map(f=><div key={f.k}><label className="text-xs text-slate-400">{f.l}</label><input className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mt-0.5" value={editProjData[f.k]||""} onChange={e=>setEditProjData(p=>({...p,[f.k]:e.target.value}))}/></div>)}
                        <div className="flex gap-2 pt-1"><button onClick={saveEditProj} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"><Save size={12}/>บันทึก</button><button onClick={()=>setEditingProj(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-xl">ยกเลิก</button></div>
                      </div>
                    ):(
                      <div className="cursor-pointer" onClick={()=>{setSelProj(project);setView("project");}}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0"><h3 className="font-semibold text-slate-800 text-sm truncate group-hover:text-indigo-700">{project.client}</h3><p className="text-xs text-slate-400 mt-0.5">สร้างเมื่อ {fmtDate(project.created_at)}</p></div>
                          {pOver.length>0&&<span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0">เลยกำหนด {pOver.length}</span>}
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1.5"><span className="text-slate-500">ความคืบหน้า</span><span className={`font-bold ${progress===100?"text-emerald-600":"text-indigo-600"}`}>{progress}%</span></div>
                          <ProgressBar value={progress}/>
                          <p className="text-xs text-slate-400 mt-1.5">{project.packages.length} แพคเกจ · {allProjClips.length} คลิป</p>
                        </div>
                        <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-2 text-xs mb-3">
                          <div><p className="text-slate-400">PM</p><p className="font-medium text-slate-600 truncate">{project.pm||"—"}</p></div>
                          <div><p className="text-slate-400">นายหน้า</p><p className="font-medium text-slate-600 truncate">{project.broker||"—"}</p></div>
                        </div>
                      </div>
                    )}
                    {!isEditP&&(
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex -space-x-1.5 cursor-pointer" onClick={()=>{setSelProj(project);setView("project");}}>
                          {[...new Set(allProjClips.map(c=>c.editor_id))].slice(0,4).map(eid=>{const ed=editors.find(e=>e.id===eid);return ed?<Avatar key={eid} editor={ed} size="sm"/>:null;})}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>setGcalModal(project)} className="flex items-center gap-1 text-xs px-2 py-1.5 border border-slate-200 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 font-medium"><CalendarDays size={13}/>Calendar</button>
                          <button onClick={()=>{setEditingProj(project.id);setEditProjData({client:project.client,pm:project.pm,broker:project.broker});}} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600"><Pencil size={13}/></button>
                          <button onClick={()=>setConfirmDel({type:"project",id:project.id})} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500"><Trash2 size={13}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PROJECT DETAIL — Package List ═══ */}
        {view==="project"&&currentProject&&(
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={()=>{setView("management");setSelProj(null);}} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500"><ArrowLeft size={18}/></button>
              <div className="flex-1 min-w-0"><h1 className="text-xl font-bold text-slate-800 truncate">{currentProject.client}</h1><p className="text-slate-500 text-xs">PM: {currentProject.pm} · นายหน้า: {currentProject.broker}</p></div>
              <button onClick={()=>setAddingPkg(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-2xl"><Plus size={16}/><span className="hidden sm:inline">เพิ่มแพคเกจ</span></button>
            </div>

            {addingPkg&&(
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-indigo-800">เพิ่มแพคเกจใหม่</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs text-slate-500 mb-1">ชื่อแพคเกจ</label><input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="เช่น มี.ค. 69 Set 1" value={newPkg.name} onChange={e=>setNewPkg(p=>({...p,name:e.target.value}))}/></div>
                  <div><label className="block text-xs text-slate-500 mb-1">จำนวนคลิปในแพคเกจ</label><input type="number" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" value={newPkg.total_clips} onChange={e=>setNewPkg(p=>({...p,total_clips:e.target.value}))}/></div>
                </div>
                <div className="flex gap-2 justify-end"><button onClick={()=>setAddingPkg(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 rounded-xl">ยกเลิก</button><button onClick={handleAddPkg} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium">เพิ่มแพคเกจ</button></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentProject.packages.length===0&&(
                <div className="col-span-2 py-16 text-center bg-white border border-slate-200 rounded-2xl">
                  <Package size={32} className="text-slate-300 mx-auto mb-3"/>
                  <p className="text-slate-400 text-sm">ยังไม่มีแพคเกจ</p>
                  <button onClick={()=>setAddingPkg(true)} className="mt-3 text-indigo-600 text-sm hover:underline">+ เพิ่มแพคเกจแรก</button>
                </div>
              )}
              {currentProject.packages.map(pkg=>{
                const progress=getProgress(pkg.clips);
                const isDone=pkg.status==="done";
                const isEditPk=editingPkg===pkg.id;
                const pOver=pkg.clips.filter(c=>c.status!=="completed"&&new Date(c.deadline)<todayDate);
                return(
                  <div key={pkg.id} className={`bg-white border rounded-2xl p-5 transition-all group ${isDone?"border-emerald-300 bg-emerald-50/30":"border-slate-200 hover:border-indigo-200 hover:shadow-md"}`}>
                    {isEditPk?(
                      <div className="space-y-2 mb-3">
                        <div><label className="text-xs text-slate-400">ชื่อแพคเกจ</label><input className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mt-0.5" value={editPkgData.name||""} onChange={e=>setEditPkgData(p=>({...p,name:e.target.value}))}/></div>
                        <div><label className="text-xs text-slate-400">จำนวนคลิป</label><input type="number" className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mt-0.5" value={editPkgData.total_clips||15} onChange={e=>setEditPkgData(p=>({...p,total_clips:e.target.value}))}/></div>
                        <div className="flex gap-2 pt-1"><button onClick={saveEditPkg} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"><Save size={12}/>บันทึก</button><button onClick={()=>setEditingPkg(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-xl">ยกเลิก</button></div>
                      </div>
                    ):(
                      <div className="cursor-pointer" onClick={()=>{setSelPkg(pkg);setView("package");}}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-800 text-sm truncate group-hover:text-indigo-700">{pkg.name}</h3>
                              {isDone&&<span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">เสร็จสิ้น</span>}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{pkg.clips.length}/{pkg.total_clips} คลิป</p>
                          </div>
                          {pOver.length>0&&<span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0">เลยกำหนด {pOver.length}</span>}
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5"><span className="text-slate-500">ความคืบหน้า</span><span className={`font-bold ${progress===100?"text-emerald-600":"text-indigo-600"}`}>{progress}%</span></div>
                          <ProgressBar value={progress}/>
                          <p className="text-xs text-slate-400 mt-1.5">เสร็จแล้ว {pkg.clips.filter(c=>c.status==="completed").length} จาก {pkg.clips.length} คลิป</p>
                        </div>
                      </div>
                    )}
                    {!isEditPk&&(
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <button
                          onClick={()=>togglePkgDone(pkg)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${isDone?"bg-emerald-100 text-emerald-700 hover:bg-emerald-200":"bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"}`}
                        >
                          <CheckSquare size={13}/>{isDone?"ยกเลิกเสร็จสิ้น":"ทำเครื่องหมายว่าเสร็จสิ้น"}
                        </button>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>{setEditingPkg(pkg.id);setEditPkgData({name:pkg.name,total_clips:pkg.total_clips});}} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600"><Pencil size={13}/></button>
                          <button onClick={()=>setConfirmDel({type:"package",id:pkg.id})} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500"><Trash2 size={13}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PACKAGE DETAIL — Clips ═══ */}
        {view==="package"&&currentProject&&currentPkg&&(
          <div className="space-y-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button onClick={()=>{setView("management");setSelProj(null);setSelPkg(null);}} className="hover:text-indigo-600 transition-colors">จัดการงาน</button>
              <ChevronRight size={14}/>
              <button onClick={()=>{setView("project");setSelPkg(null);}} className="hover:text-indigo-600 transition-colors">{currentProject.client}</button>
              <ChevronRight size={14}/>
              <span className="text-slate-800 font-medium">{currentPkg.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={()=>{setView("project");setSelPkg(null);}} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500"><ArrowLeft size={18}/></button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-800 truncate">{currentPkg.name}</h1>
                <p className="text-slate-500 text-xs">{currentProject.client} · {currentPkg.clips.length}/{currentPkg.total_clips} คลิป</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <button
                  onClick={()=>togglePkgDone(currentPkg)}
                  className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-colors ${currentPkg.status==="done"?"bg-emerald-100 text-emerald-700 hover:bg-emerald-200":"bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"}`}
                >
                  <CheckSquare size={14}/>{currentPkg.status==="done"?"ยกเลิกเสร็จสิ้น":"เสร็จสิ้นแพคเกจนี้"}
                </button>
                <button
                  onClick={()=>exportToExcel(currentProject.client, currentPkg.name, currentPkg.clips, editors)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                >
                  <Download size={14}/>Export Excel
                </button>
                <button onClick={()=>setAddingClip(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-2xl"><Plus size={16}/><span className="hidden sm:inline">เพิ่มคลิป</span></button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <ProgressBar value={getProgress(currentPkg.clips)}/>
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>เสร็จสิ้น {currentPkg.clips.filter(c=>c.status==="completed").length} คลิป</span>
                <span>ทั้งหมด {currentPkg.clips.length}/{currentPkg.total_clips} คลิป</span>
              </div>
            </div>

            {addingClip&&(
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-indigo-800">เพิ่มคลิปใหม่</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm col-span-1 sm:col-span-2 lg:col-span-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" placeholder="ชื่อคลิป..." value={newClip.name} onChange={e=>setNewClip(p=>({...p,name:e.target.value}))}/>
                  <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" value={newClip.editorId} onChange={e=>setNewClip(p=>({...p,editorId:e.target.value}))}>
                    <option value="">เลือกคนตัดต่อ</option>{editors.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <DatePicker value={newClip.deadline} onChange={v=>setNewClip(p=>({...p,deadline:v}))} placeholder="เลือก Deadline"/>
                  <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" value={newClip.status} onChange={e=>setNewClip(p=>({...p,status:e.target.value}))}>{STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative"><MessageSquare size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="หมายเหตุ..." value={newClip.note} onChange={e=>setNewClip(p=>({...p,note:e.target.value}))}/></div>
                  <div className="relative"><Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Link งาน..." value={newClip.link} onChange={e=>setNewClip(p=>({...p,link:e.target.value}))}/></div>
                </div>
                <div className="flex gap-2 justify-end"><button onClick={()=>setAddingClip(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 rounded-xl">ยกเลิก</button><button onClick={handleAddClip} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium">เพิ่มคลิป</button></div>
              </div>
            )}

            <div className="space-y-3">
              {currentPkg.clips.length===0&&<div className="py-16 text-center bg-white border border-slate-200 rounded-2xl"><Film size={32} className="text-slate-300 mx-auto mb-3"/><p className="text-slate-400 text-sm">ยังไม่มีคลิปในแพคเกจนี้</p><button onClick={()=>setAddingClip(true)} className="mt-3 text-indigo-600 text-sm hover:underline">+ เพิ่มคลิปแรก</button></div>}
              {[...currentPkg.clips].sort((a,b)=>(a.sort_order||999)-(b.sort_order||999)).map(clip=>{
                const editing=editingClip===clip.id;
                const editor=editors.find(e=>e.id===clip.editor_id);
                const isOver=clip.status!=="completed"&&new Date(clip.deadline)<todayDate;
                const platforms=(clip.post_platforms||"").split(",").filter(Boolean);
                const PLATFORMS=[{id:"TT",label:"TikTok",color:"bg-slate-800 text-white"},{id:"IG",label:"Instagram",color:"bg-pink-500 text-white"},{id:"FB",label:"Facebook",color:"bg-blue-600 text-white"}];
                const POST_STATUSES=[{value:"waiting",label:"รอโพสต์",color:"bg-amber-100 text-amber-700"},{value:"posted",label:"โพสต์แล้ว",color:"bg-emerald-100 text-emerald-700"},{value:"cancelled",label:"ยกเลิก",color:"bg-slate-100 text-slate-500"}];
                const postSt=POST_STATUSES.find(s=>s.value===(clip.post_status||"waiting"))||POST_STATUSES[0];
                function togglePlatform(pid){
                  const cur=(clip.post_platforms||"").split(",").filter(Boolean);
                  const next=cur.includes(pid)?cur.filter(x=>x!==pid):[...cur,pid];
                  updateClip(clip.id,{post_platforms:next.join(",")});
                }
                return(
                  <div key={clip.id} className={`bg-white border rounded-2xl overflow-hidden transition-all ${editing?"border-indigo-300 shadow-md":"border-slate-200 hover:border-slate-300"}`}>
                    {/* Row 1: ชื่อ + ปุ่ม */}
                    <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {editing
                          ?<input className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300" defaultValue={clip.name} autoFocus onBlur={e=>updateClip(clip.id,{name:e.target.value})}/>
                          :<p className="font-semibold text-slate-800 text-sm">{clip.name}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={()=>setEditingClip(editing?null:clip.id)} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${editing?"bg-indigo-600 text-white":"hover:bg-slate-100 text-slate-400"}`}>{editing?<Check size={13}/>:<Edit2 size={13}/>}</button>
                        <button onClick={()=>setConfirmDel({type:"clip",id:clip.id})} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-500 text-slate-300"><Trash2 size={13}/></button>
                      </div>
                    </div>

                    {/* Row 2: ตัดต่อ + deadline + สถานะ */}
                    <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">คนตัดต่อ</p>
                        {editing
                          ?<select className="w-full border border-indigo-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none" value={clip.editor_id||""} onChange={e=>updateClip(clip.id,{editor_id:e.target.value?parseInt(e.target.value):null})}><option value="">ไม่ระบุ</option>{editors.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
                          :<div className="flex items-center gap-1.5"><Avatar editor={editor} size="sm"/><span className="text-xs text-slate-600">{editor?editor.name:"ไม่ระบุ"}</span></div>}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Deadline ตัดต่อ</p>
                        {editing
                          ?<DatePicker value={clip.deadline} onChange={v=>updateClip(clip.id,{deadline:v})}/>
                          :<span className={`text-xs font-medium ${isOver?"text-red-500":"text-slate-600"}`}>{fmtDate(clip.deadline)}{isOver?" ⚠":""}</span>}
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-slate-400 mb-1">สถานะตัดต่อ</p>
                        <select className="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer" value={clip.status} onChange={e=>updateClip(clip.id,{status:e.target.value})}>{STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
                      </div>
                    </div>

                    {/* Row 3: Caption */}
                    <div className="px-4 pb-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText size={13} className="text-violet-500"/>
                        <p className="text-xs font-semibold text-slate-600">Caption</p>
                      </div>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white resize-none transition-colors"
                        rows={2}
                        placeholder="พิมพ์แคปชั่นที่นี่..."
                        defaultValue={clip.caption||""}
                        onBlur={e=>updateClip(clip.id,{caption:e.target.value})}
                      />
                    </div>

                    {/* Row 4: Social Media */}
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 size={13} className="text-pink-500"/>
                        <p className="text-xs font-semibold text-slate-600">Post Social Media</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Platform toggles */}
                        <div className="flex gap-1.5 flex-wrap sm:col-span-1">
                          {PLATFORMS.map(pl=>{
                            const active=platforms.includes(pl.id);
                            return<button key={pl.id} onClick={()=>togglePlatform(pl.id)} className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${active?pl.color:"bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>{pl.id}</button>;
                          })}
                        </div>
                        {/* Post date */}
                        <div className="sm:col-span-1">
                          <DatePicker value={clip.post_date||""} onChange={v=>updateClip(clip.id,{post_date:v})} placeholder="วันที่ลงโพสต์"/>
                        </div>
                        {/* Post status */}
                        <div className="sm:col-span-1">
                          <select className="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 cursor-pointer" value={clip.post_status||"waiting"} onChange={e=>updateClip(clip.id,{post_status:e.target.value})}>
                            {POST_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                      {/* Platform badges + post status pill */}
                      {(platforms.length>0||clip.post_date)&&(
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {platforms.map(pid=>{const pl=PLATFORMS.find(p=>p.id===pid);return pl?<span key={pid} className={`text-xs px-2 py-0.5 rounded-full font-medium ${pl.color}`}>{pl.label}</span>:null;})}
                          {clip.post_date&&<span className="text-xs text-slate-400">📅 {fmtDate(clip.post_date)}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${postSt.color}`}>{postSt.label}</span>
                        </div>
                      )}
                    </div>

                    {/* Row 5: Note + Link */}
                    {(clip.note||clip.link||editing)&&(
                      <div className="px-4 pb-3 border-t border-slate-100 pt-2 flex flex-wrap gap-3">
                        {editing
                          ?<><input className="flex-1 min-w-0 border border-indigo-300 rounded-lg px-2 py-1 text-xs focus:outline-none" placeholder="หมายเหตุ..." defaultValue={clip.note} onBlur={e=>updateClip(clip.id,{note:e.target.value})}/><input className="flex-1 min-w-0 border border-indigo-300 rounded-lg px-2 py-1 text-xs focus:outline-none" placeholder="Link งาน..." defaultValue={clip.link} onBlur={e=>updateClip(clip.id,{link:e.target.value})}/></>
                          :<>{clip.note&&<p className="text-xs text-slate-500 flex items-center gap-1"><MessageSquare size={10} className="text-slate-400"/>{clip.note}</p>}{clip.link&&<a href={clip.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Link2 size={10}/>เปิดลิงก์</a>}</>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ EDITORS ═══ */}
        {view==="editors"&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-800">ทีมตัดต่อ</h1><p className="text-slate-500 text-sm mt-1">{editors.length} คน</p></div><button onClick={addEditor} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-2xl"><Plus size={16}/><span className="hidden sm:inline">เพิ่มคนตัดต่อ</span></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editors.map(editor=>{
                const ec=allClips.filter(c=>c.editor_id===editor.id);
                const done=ec.filter(c=>c.status==="completed").length;
                const inProg=ec.filter(c=>c.status==="in_progress").length;
                const ov=ec.filter(c=>c.status!=="completed"&&new Date(c.deadline)<todayDate);
                const wl=ec.length;
                const isEditE=editingEditorId===editor.id;
                return(
                  <div key={editor.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar editor={editor} size="lg"/>
                      <div className="flex-1 min-w-0">
                        {isEditE?(
                          <div className="flex items-center gap-2"><input autoFocus className="flex-1 border border-indigo-300 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300" value={editEditorName} onChange={e=>setEditEditorName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEditorName(editor.id);if(e.key==="Escape")setEditingEditorId(null);}}/><button onClick={()=>saveEditorName(editor.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0"><Check size={13}/></button></div>
                        ):(
                          <div className="flex items-center gap-2"><h3 className="font-semibold text-slate-800 cursor-pointer hover:text-indigo-700" onClick={()=>{setSelEditor(editor);setView("editor");}}>{editor.name}</h3><button onClick={()=>{setEditingEditorId(editor.id);setEditEditorName(editor.name);}} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100"><Pencil size={12}/></button></div>
                        )}
                        <p className="text-xs text-slate-400">คนตัดต่อ</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ov.length>0&&<span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">เลยกำหนด {ov.length}</span>}
                        <button onClick={()=>setConfirmDel({type:"editor",id:editor.id})} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={13}/></button>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 cursor-pointer" onClick={()=>{setSelEditor(editor);setView("editor");}}/>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">{[{l:"ทั้งหมด",v:wl,c:"text-slate-700"},{l:"กำลังทำ",v:inProg,c:"text-indigo-600"},{l:"เสร็จแล้ว",v:done,c:"text-emerald-600"}].map(s=><div key={s.l} className="bg-slate-50 rounded-xl p-2.5 text-center"><div className={`text-xl font-bold ${s.c}`}>{s.v}</div><div className="text-xs text-slate-400 mt-0.5">{s.l}</div></div>)}</div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5"><span className="text-slate-500">ความคืบหน้างาน</span><span className={`font-bold ${getProgress(ec)===100?"text-emerald-600":"text-indigo-600"}`}>{getProgress(ec)}%</span></div>
                      <ProgressBar value={getProgress(ec)}/>
                    </div>
                    <div><div className="flex items-center justify-between text-xs text-slate-500 mb-1.5"><span>ภาระงาน</span><span className={`font-semibold ${wl>=8?"text-red-500":wl>=5?"text-amber-500":"text-emerald-600"}`}>{wl>=8?"หนักมาก":wl>=5?"ปานกลาง":"ปกติ"}</span></div><div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full transition-all ${wl>=8?"bg-red-400":wl>=5?"bg-amber-400":"bg-emerald-400"}`} style={{width:`${Math.min(wl/10*100,100)}%`}}/></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ EDITOR DETAIL ═══ */}
        {view==="editor"&&selEditor&&(()=>{
          const editorData=editors.find(e=>e.id===selEditor.id)||selEditor;
          const ec=allClips.filter(c=>c.editor_id===selEditor.id);
          const overdueEc=ec.filter(c=>c.status!=="completed"&&new Date(c.deadline)<todayDate);
          return(
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={()=>{setView("editors");setSelEditor(null);}} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500"><ArrowLeft size={18}/></button>
                <Avatar editor={editorData} size="lg"/>
                <div className="flex-1"><h1 className="text-xl font-bold text-slate-800">{editorData.name}</h1><p className="text-slate-500 text-xs">รายการงานที่รับผิดชอบ</p></div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">{STATUSES.map(s=><div key={s.value} className="bg-white border border-slate-200 rounded-2xl p-3 text-center"><div className="text-2xl font-bold text-slate-800">{ec.filter(c=>c.status===s.value).length}</div><div className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</div></div>)}</div>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800 text-sm">คลิปทั้งหมด ({ec.length} รายการ)</h2></div>
                {ec.length===0?<div className="py-16 text-center"><Film size={32} className="text-slate-300 mx-auto mb-3"/><p className="text-slate-400 text-sm">ยังไม่มีงานที่รับผิดชอบ</p></div>:(
                  <div className="divide-y divide-slate-100">
                    {ec.map(clip=>{
                      const isOver=clip.status!=="completed"&&new Date(clip.deadline)<todayDate;
                      return(
                        <div key={clip.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                          <div className={`w-2 h-10 rounded-full shrink-0 ${clip.status==="completed"?"bg-emerald-400":clip.status==="in_progress"?"bg-indigo-400":clip.status==="review"?"bg-amber-400":isOver?"bg-red-400":"bg-slate-200"}`}/>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>{const proj=projects.find(p=>p.id===clip.projectId);const pkg=proj?.packages.find(pk=>pk.id===clip.package_id);if(proj&&pkg){setSelProj(proj);setSelPkg(pkg);setView("package");}}}>
                            <p className="font-medium text-slate-800 text-sm truncate">{clip.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{clip.projectName} · {clip.packageName}</p>
                            {clip.note&&<p className="text-xs text-slate-400 mt-0.5 truncate italic">{clip.note}</p>}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <StatusBadge status={clip.status}/>
                            <p className={`text-xs ${isOver?"text-red-500 font-medium":"text-slate-400"}`}>{fmtDate(clip.deadline)}{isOver?" ⚠":""}</p>
                          </div>
                          {clip.link&&<a href={clip.link} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300"><ExternalLink size={13}/></a>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 z-40">
        <div className="flex items-stretch h-16">
          {navItems.map(item=>{const Icon=item.icon;const active=isActive(item.id);return<button key={item.id} onClick={()=>navGo(item.id)} className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors ${active?"text-indigo-600":"text-slate-400"}`}><Icon size={19}/><span className="text-xs font-medium">{item.label}</span>{active&&<div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-b-full"/>}</button>;})}
        </div>
      </nav>
    </div>
  );
}
