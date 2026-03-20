import { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, Users, FolderOpen, ChevronRight, Plus,
  Clock, CheckCircle2, AlertTriangle, Film, Calendar, ChevronLeft,
  Edit2, Check, Loader2, Circle, Eye, ArrowLeft, Trash2,
  Search, Bell, Target, ChevronDown, CalendarPlus, CalendarDays,
  ExternalLink, Link2, MessageSquare, X, Save, Pencil
} from "lucide-react";

// ─── Default Data ────────────────────────────────────────────────
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

const EDITOR_COLORS = [
  "bg-indigo-500","bg-violet-500","bg-pink-500","bg-sky-500",
  "bg-emerald-500","bg-amber-500","bg-rose-500","bg-teal-500",
  "bg-orange-500","bg-cyan-500","bg-purple-500","bg-lime-500",
];

const STATUSES = [
  { value: "pending",     label: "รอดำเนินการ", icon: Circle,       bg: "bg-slate-100 text-slate-600",   dot: "bg-slate-400"    },
  { value: "in_progress", label: "กำลังตัดต่อ", icon: Loader2,      bg: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500"   },
  { value: "review",      label: "รอตรวจงาน",   icon: Eye,          bg: "bg-amber-100 text-amber-700",   dot: "bg-amber-400"    },
  { value: "revision",    label: "แก้ไข",        icon: Edit2,        bg: "bg-orange-100 text-orange-700", dot: "bg-orange-400"   },
  { value: "completed",   label: "เสร็จสิ้น",    icon: CheckCircle2, bg: "bg-emerald-100 text-emerald-700",dot:"bg-emerald-500"  },
];

const TH_MONTHS       = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const TH_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const TH_DAYS         = ["อา","จ","อ","พ","พฤ","ศ","ส"];

const todayDate = new Date();
todayDate.setHours(0, 0, 0, 0);

function addDays(n) {
  const d = new Date(todayDate);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`;
}

function makeId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function initProjects(editors) {
  return [
    {
      id: "proj-1", client: "บริษัท เทคโนวิชั่น จำกัด", pm: "คุณมาลี", broker: "คุณสมชาย", createdAt: addDays(-10),
      clips: [
        { id: "c1", name: "Corporate Intro - Version 1",   editorId: editors[0].id, deadline: addDays(-1), status: "completed",  note: "", link: "" },
        { id: "c2", name: "Product Showcase - Hero Scene", editorId: editors[1].id, deadline: addDays(1),  status: "review",     note: "", link: "" },
        { id: "c3", name: "Behind The Scenes - Day 1",     editorId: editors[2].id, deadline: addDays(2),  status: "in_progress",note: "", link: "" },
        { id: "c4", name: "Customer Testimonial - Pack A", editorId: editors[0].id, deadline: addDays(4),  status: "pending",    note: "", link: "" },
        { id: "c5", name: "Social Media Cut - 30sec",      editorId: editors[4].id, deadline: addDays(-2), status: "revision",   note: "ลูกค้าขอแก้สีโทน warm", link: "" },
      ],
    },
    {
      id: "proj-2", client: "โรงแรม ซันไรส์ รีสอร์ท", pm: "คุณพิม", broker: "คุณอนันต์", createdAt: addDays(-5),
      clips: [
        { id: "c6", name: "Hotel Overview - Main Film", editorId: editors[3].id, deadline: addDays(3), status: "in_progress", note: "", link: "" },
        { id: "c7", name: "Room Tour - Deluxe Suite",   editorId: editors[5].id, deadline: addDays(5), status: "pending",    note: "", link: "" },
        { id: "c8", name: "Spa & Wellness Highlight",   editorId: editors[6].id, deadline: addDays(0), status: "review",     note: "", link: "" },
      ],
    },
    {
      id: "proj-3", client: "ร้านอาหาร เฮือนลาว", pm: "คุณกานต์", broker: "คุณปอ", createdAt: addDays(-3),
      clips: [
        { id: "c9",  name: "Menu Highlight Reel",        editorId: editors[7].id,  deadline: addDays(2), status: "completed", note: "", link: "" },
        { id: "c10", name: "Chef Story Documentary",     editorId: editors[8].id,  deadline: addDays(6), status: "completed", note: "", link: "" },
        { id: "c11", name: "Ambiance & Atmosphere Clip", editorId: editors[9].id,  deadline: addDays(1), status: "completed", note: "", link: "" },
      ],
    },
  ];
}

// ─── Hooks ────────────────────────────────────────────────────────
function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : (typeof init === "function" ? init() : init);
    } catch { return typeof init === "function" ? init() : init; }
  });
  function set(v) {
    const n = typeof v === "function" ? v(val) : v;
    setVal(n);
    localStorage.setItem(key, JSON.stringify(n));
  }
  return [val, set];
}

// ─── Google Calendar ──────────────────────────────────────────────
function openGCal(title, date, details) {
  const s = (date || "").replace(/-/g, "");
  const d = new Date(date); d.setDate(d.getDate() + 1);
  const e = d.toISOString().split("T")[0].replace(/-/g, "");
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${s}/${e}`, details: details || "", sf: "true", output: "xml" });
  window.open(`https://calendar.google.com/calendar/render?${p}`, "_blank");
}

// ─── UI Atoms ─────────────────────────────────────────────────────
function Avatar({ editor, size }) {
  if (!editor) return <span className="text-slate-400 text-xs italic">ไม่ระบุ</span>;
  const sz = size === "lg" ? "w-12 h-12 text-base" : size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  const initials = editor.name.replace(/^(นาย|นางสาว|นาง)/, "").slice(0, 2);
  return (
    <div className={`${sz} ${editor.color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
      <Icon size={11} className={status === "in_progress" ? "animate-spin" : ""} />
      {s.label}
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${value === 100 ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${value}%` }} />
    </div>
  );
}

// ─── Date Picker ──────────────────────────────────────────────────
function DatePicker({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("days");
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : todayDate.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setMode("days"); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (value) { setViewYear(new Date(value).getFullYear()); setViewMonth(new Date(value).getMonth()); }
  }, [value]);

  const selected = value ? new Date(value) : null;
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInM  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells    = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInM }, (_, i) => i + 1));

  function pick(day) { onChange(new Date(viewYear, viewMonth, day).toISOString().split("T")[0]); setOpen(false); setMode("days"); }
  function isTod(d)  { return new Date(viewYear, viewMonth, d).toDateString() === todayDate.toDateString(); }
  function isSel(d)  { return selected && new Date(viewYear, viewMonth, d).toDateString() === selected.toDateString(); }

  function prev() {
    if (mode === "days") { viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1); }
    else if (mode === "months") setViewYear(y => y - 1);
    else setViewYear(y => y - 12);
  }
  function next() {
    if (mode === "days") { viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1); }
    else if (mode === "months") setViewYear(y => y + 1);
    else setViewYear(y => y + 12);
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors">
        <Calendar size={14} className="text-indigo-400 shrink-0" />
        <span className={`flex-1 text-left truncate ${value ? "text-slate-700" : "text-slate-400"}`}>{value ? fmtDate(value) : (placeholder || "เลือกวันที่")}</span>
        <ChevronDown size={13} className="text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 left-0 bg-white border border-slate-200 rounded-2xl shadow-2xl w-72 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500"><ChevronLeft size={15} /></button>
            <div className="flex items-center gap-1">
              {mode !== "months" && (
                <button onClick={() => setMode(m => m === "days" ? "months" : "days")}
                  className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                  {TH_MONTHS[viewMonth]}
                </button>
              )}
              <button onClick={() => setMode(m => m === "years" ? "days" : "years")}
                className="text-sm font-bold text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                {viewYear + 543}
              </button>
            </div>
            <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500"><ChevronRight size={15} /></button>
          </div>
          {mode === "years" && (
            <div className="grid grid-cols-4 gap-1 p-3">
              {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map(y => (
                <button key={y} onClick={() => { setViewYear(y); setMode("months"); }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${y === viewYear ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-slate-700"}`}>{y + 543}</button>
              ))}
            </div>
          )}
          {mode === "months" && (
            <div className="grid grid-cols-3 gap-1 p-3">
              {TH_MONTHS_SHORT.map((m, i) => (
                <button key={i} onClick={() => { setViewMonth(i); setMode("days"); }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${i === viewMonth ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-slate-700"}`}>{m}</button>
              ))}
            </div>
          )}
          {mode === "days" && (
            <div className="p-3">
              <div className="grid grid-cols-7 mb-1.5">
                {TH_DAYS.map((d, i) => (
                  <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => (
                  <div key={i}>
                    {day ? (
                      <button onClick={() => pick(day)}
                        className={`w-full aspect-square rounded-xl text-sm font-medium transition-all flex items-center justify-center
                          ${isSel(day) ? "bg-indigo-600 text-white" : isTod(day) ? "bg-indigo-100 text-indigo-700 font-bold ring-2 ring-indigo-300" : "hover:bg-slate-100 text-slate-700"}`}>
                        {day}
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button onClick={() => { onChange(todayDate.toISOString().split("T")[0]); setOpen(false); }} className="text-xs text-indigo-600 hover:underline font-semibold">วันนี้</button>
                {value && <button onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-slate-400 hover:text-red-500 transition-colors">ล้างค่า</button>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── GCal Export Modal ────────────────────────────────────────────
function GCalModal({ project, editors, onClose }) {
  const pending = project.clips.filter(c => c.status !== "completed");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-blue-500" />
            <h2 className="font-bold text-slate-800 text-sm">ส่งออกไป Google Calendar</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">โปรเจกต์: <span className="font-semibold text-slate-700">{project.client}</span></p>
          <p className="text-xs text-slate-400 mb-4">คลิกปุ่ม "สร้าง" เพื่อเปิด Google Calendar</p>
          {pending.length === 0 ? (
            <div className="py-8 text-center"><CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" /><p className="text-sm text-slate-400">งานทุกชิ้นเสร็จสิ้นแล้ว</p></div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pending.map(clip => {
                const editor = editors.find(e => e.id === clip.editorId);
                const isOver = new Date(clip.deadline) < todayDate;
                const details = `[Digicon Team]\nโปรเจกต์: ${project.client}\nคนตัดต่อ: ${editor ? editor.name : "ไม่ระบุ"}\nสถานะ: ${STATUSES.find(s => s.value === clip.status)?.label}${clip.note ? `\nหมายเหตุ: ${clip.note}` : ""}`;
                return (
                  <div key={clip.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p>
                      <p className={`text-xs mt-0.5 ${isOver ? "text-red-500 font-medium" : "text-slate-400"}`}>Deadline: {fmtDate(clip.deadline)}{isOver ? " ⚠" : ""}</p>
                    </div>
                    <button onClick={() => openGCal(`[Digicon] ${clip.name}`, clip.deadline, details)}
                      className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all font-medium">
                      <CalendarPlus size={13} />สร้าง
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-400">เหลืองาน {pending.length} รายการ</p>
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">ปิด</button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <p className="text-slate-700 font-medium mb-5 text-center">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-5 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="px-5 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors font-medium">ลบ</button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────
function CalendarView({ allClips, editors }) {
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [selDay, setSelDay] = useState(null);

  const firstDay   = new Date(calYear, calMonth, 1).getDay();
  const daysInM    = new Date(calYear, calMonth + 1, 0).getDate();
  const prevM      = new Date(calYear, calMonth, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevM - i, cur: false });
  for (let i = 1; i <= daysInM; i++) cells.push({ day: i, cur: true });
  for (let i = 1; i <= 42 - cells.length; i++) cells.push({ day: i, cur: false });

  function clipsOn(day, cur) {
    if (!cur) return [];
    const ds = new Date(calYear, calMonth, day).toISOString().split("T")[0];
    return allClips.filter(c => c.deadline === ds);
  }
  function isTod(d, c) { return c && new Date(calYear, calMonth, d).toDateString() === todayDate.toDateString(); }
  function isSel(d, c) { return c && selDay && new Date(calYear, calMonth, d).toDateString() === selDay.toDateString(); }

  const selClips = selDay ? allClips.filter(c => c.deadline === selDay.toISOString().split("T")[0]) : [];

  function prevM2() { calMonth === 0 ? (setCalMonth(11), setCalYear(y => y - 1)) : setCalMonth(m => m - 1); }
  function nextM2() { calMonth === 11 ? (setCalMonth(0), setCalYear(y => y + 1)) : setCalMonth(m => m + 1); }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-800">ปฏิทิน Deadline</h1><p className="text-slate-500 text-sm mt-1">คลิกวันที่เพื่อดูงาน</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={prevM2} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500"><ChevronLeft size={18} /></button>
            <h2 className="font-bold text-slate-800">{TH_MONTHS[calMonth]} {calYear + 543}</h2>
            <button onClick={nextM2} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100">
            {TH_DAYS.map((d, i) => (
              <div key={d} className={`text-center py-2.5 text-xs font-semibold ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const clips = clipsOn(cell.day, cell.cur);
              const sel = isSel(cell.day, cell.cur);
              const tod = isTod(cell.day, cell.cur);
              const col = idx % 7;
              return (
                <div key={idx} onClick={() => { if (!cell.cur) return; const d = new Date(calYear, calMonth, cell.day); setSelDay(sel ? null : d); }}
                  className={`min-h-16 p-1.5 border-b border-r border-slate-100 transition-colors ${col === 6 ? "border-r-0" : ""} ${!cell.cur ? "bg-slate-50/60" : sel ? "bg-indigo-50" : "hover:bg-slate-50 cursor-pointer"}`}>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold mb-1 mx-auto
                    ${tod ? "bg-indigo-600 text-white" : sel ? "bg-indigo-100 text-indigo-700" : cell.cur ? (col === 0 ? "text-red-400" : col === 6 ? "text-blue-400" : "text-slate-700") : "text-slate-300"}`}>
                    {cell.day}
                  </div>
                  {cell.cur && clips.length > 0 && (
                    <div className="space-y-0.5">
                      {clips.slice(0, 2).map(c => {
                        const st = STATUSES.find(s => s.value === c.status);
                        return <div key={c.id} className={`text-xs px-1.5 py-0.5 rounded-md truncate font-medium leading-tight ${st.bg}`}>{c.name.length > 9 ? c.name.slice(0, 9) + "…" : c.name}</div>;
                      })}
                      {clips.length > 2 && <div className="text-xs text-center text-slate-400 font-medium">+{clips.length - 2}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">สถานะงาน</h3>
            <div className="space-y-2.5">
              {STATUSES.map(s => (
                <div key={s.value} className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                  <span className="text-sm text-slate-600 flex-1">{s.label}</span>
                  <span className="text-sm font-bold text-slate-700">{allClips.filter(c => c.status === s.value).length}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-700 flex-1 truncate">
                {selDay ? `${selDay.getDate()} ${TH_MONTHS[selDay.getMonth()]} ${selDay.getFullYear() + 543}` : "คลิกวันที่เพื่อดูงาน"}
              </h3>
              {selClips.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">{selClips.length}</span>}
            </div>
            {!selDay ? (
              <div className="py-10 text-center"><Calendar size={28} className="text-slate-200 mx-auto mb-2" /><p className="text-slate-400 text-xs">เลือกวันจากปฏิทิน</p></div>
            ) : selClips.length === 0 ? (
              <div className="py-10 text-center"><CheckCircle2 size={28} className="text-emerald-300 mx-auto mb-2" /><p className="text-slate-400 text-xs">ไม่มีงานวันนี้</p></div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {selClips.map(clip => {
                  const editor = editors.find(e => e.id === clip.editorId);
                  return (
                    <div key={clip.id} className="px-4 py-3 flex items-start gap-2">
                      <Avatar editor={editor} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p>
                        <p className="text-xs text-slate-400 truncate">{clip.projectName}</p>
                        <div className="mt-1"><StatusBadge status={clip.status} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-700">งาน 7 วันข้างหน้า</h3></div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(todayDate); d.setDate(d.getDate() + i);
                const ds = d.toISOString().split("T")[0];
                const clips = allClips.filter(c => c.deadline === ds && c.status !== "completed");
                if (!clips.length) return null;
                return (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelDay(d)}>
                    <div className={`w-9 text-center shrink-0 ${i === 0 ? "text-indigo-600" : "text-slate-500"}`}>
                      <div className="text-xs text-slate-400">{TH_DAYS[d.getDay()]}</div>
                      <div className="text-base font-bold leading-tight">{d.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                      {clips.slice(0, 2).map(c => {
                        const st = STATUSES.find(s => s.value === c.status);
                        return <span key={c.id} className={`text-xs px-1.5 py-0.5 rounded-full ${st.bg}`}>{c.name.slice(0, 12)}{c.name.length > 12 ? "…" : ""}</span>;
                      })}
                      {clips.length > 2 && <span className="text-xs text-slate-400 self-center">+{clips.length - 2}</span>}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
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
  const [editors, setEditors] = useLS("digicon_editors_v1", DEFAULT_EDITORS);
  const [projects, setProjects] = useLS("digicon_projects_v4", () => initProjects(DEFAULT_EDITORS));

  const [view, setView] = useState("dashboard");
  const [selProj, setSelProj] = useState(null);
  const [selEditor, setSelEditor] = useState(null);
  const [gcalModal, setGcalModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null); // { type, id, projId? }

  // Clip editing
  const [editingClip, setEditingClip] = useState(null);
  const [addingClip, setAddingClip] = useState(false);
  const [newClip, setNewClip] = useState({ name: "", editorId: "", deadline: "", status: "pending", note: "", link: "" });

  // Project editing
  const [addingProj, setAddingProj] = useState(false);
  const [editingProj, setEditingProj] = useState(null); // project id being edited
  const [editProjData, setEditProjData] = useState({});
  const [newProj, setNewProj] = useState({ client: "", pm: "", broker: "" });

  // Editor editing
  const [editingEditorId, setEditingEditorId] = useState(null);
  const [editEditorName, setEditEditorName] = useState("");

  const [search, setSearch] = useState("");

  const allClips = useMemo(() =>
    projects.flatMap(p => p.clips.map(c => ({ ...c, projectId: p.id, projectName: p.client }))),
    [projects]
  );

  const overdue     = allClips.filter(c => c.status !== "completed" && new Date(c.deadline) < todayDate);
  const dueSoon     = allClips.filter(c => { const diff = (new Date(c.deadline) - todayDate) / 86400000; return c.status !== "completed" && diff >= 0 && diff <= 2; });
  const awaitReview = allClips.filter(c => c.status === "review");
  const dueToday    = allClips.filter(c => new Date(c.deadline).toDateString() === todayDate.toDateString() && c.status !== "completed");

  function getProgress(clips) {
    if (!clips.length) return 0;
    return Math.round(clips.filter(c => c.status === "completed").length / clips.length * 100);
  }

  // ── Project CRUD ──────────────────────────────────────────────
  function handleAddProj() {
    if (!newProj.client.trim()) return;
    setProjects(prev => [...prev, { id: makeId(), client: newProj.client, pm: newProj.pm, broker: newProj.broker, createdAt: new Date().toISOString().split("T")[0], clips: [] }]);
    setNewProj({ client: "", pm: "", broker: "" });
    setAddingProj(false);
  }

  function startEditProj(proj) {
    setEditingProj(proj.id);
    setEditProjData({ client: proj.client, pm: proj.pm, broker: proj.broker });
  }

  function saveEditProj() {
    setProjects(prev => prev.map(p => p.id === editingProj ? { ...p, ...editProjData } : p));
    if (selProj && selProj.id === editingProj) setSelProj(p => ({ ...p, ...editProjData }));
    setEditingProj(null);
  }

  function deleteProj(id) {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selProj && selProj.id === id) { setSelProj(null); setView("management"); }
    setConfirmDel(null);
  }

  // ── Clip CRUD ─────────────────────────────────────────────────
  function updateClip(pid, cid, changes) {
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, clips: p.clips.map(c => c.id === cid ? { ...c, ...changes } : c) } : p));
  }

  function deleteClip(pid, cid) {
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, clips: p.clips.filter(c => c.id !== cid) } : p));
    setConfirmDel(null);
  }

  function handleAddClip() {
    if (!newClip.name.trim()) return;
    const clip = { id: makeId(), name: newClip.name, editorId: newClip.editorId ? parseInt(newClip.editorId) : null, deadline: newClip.deadline || addDays(7), status: newClip.status || "pending", note: newClip.note || "", link: newClip.link || "" };
    setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, clips: [...p.clips, clip] } : p));
    setNewClip({ name: "", editorId: "", deadline: "", status: "pending", note: "", link: "" });
    setAddingClip(false);
  }

  // ── Editor CRUD ───────────────────────────────────────────────
  function saveEditorName(id) {
    if (editEditorName.trim()) {
      setEditors(prev => prev.map(e => e.id === id ? { ...e, name: editEditorName.trim() } : e));
    }
    setEditingEditorId(null);
  }

  function addEditor() {
    const color = EDITOR_COLORS[editors.length % EDITOR_COLORS.length];
    const newEd = { id: Date.now(), name: `คนตัดต่อใหม่ ${editors.length + 1}`, color };
    setEditors(prev => [...prev, newEd]);
    setEditingEditorId(newEd.id);
    setEditEditorName(newEd.name);
  }

  function deleteEditor(id) {
    setEditors(prev => prev.filter(e => e.id !== id));
    // remove from clips
    setProjects(prev => prev.map(p => ({ ...p, clips: p.clips.map(c => c.editorId === id ? { ...c, editorId: null } : c) })));
    setConfirmDel(null);
  }

  const currentProject = selProj ? projects.find(p => p.id === selProj.id) : null;

  const navItems = [
    { id: "dashboard",  label: "แดชบอร์ด", icon: LayoutDashboard },
    { id: "calendar",   label: "ปฏิทิน",   icon: Calendar        },
    { id: "management", label: "จัดการงาน", icon: FolderOpen      },
    { id: "editors",    label: "ทีมงาน",   icon: Users           },
  ];

  function navGo(id) { setView(id); setSelProj(null); setSelEditor(null); setEditingClip(null); }
  function isActive(id) { return view === id || (id === "management" && view === "project") || (id === "editors" && view === "editor"); }

  return (
    <div className="min-h-screen bg-slate-50">
      {gcalModal && <GCalModal project={gcalModal} editors={editors} onClose={() => setGcalModal(null)} />}
      {confirmDel && (
        <ConfirmDialog
          message={confirmDel.type === "clip" ? "ลบคลิปนี้?" : confirmDel.type === "project" ? "ลบโปรเจกต์นี้ทั้งหมด?" : "ลบคนตัดต่อคนนี้?"}
          onConfirm={() => {
            if (confirmDel.type === "clip") deleteClip(confirmDel.projId, confirmDel.id);
            else if (confirmDel.type === "project") deleteProj(confirmDel.id);
            else deleteEditor(confirmDel.id);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Film size={16} className="text-white" />
            </div>
            <div className="leading-none">
              <span className="font-black text-slate-800 text-base tracking-tight">Digicon</span>
              <span className="font-black text-indigo-500 text-base tracking-tight"> Team</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => navGo(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${isActive(item.id) ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
                  <Icon size={15} />{item.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm bg-slate-100 border-0 rounded-xl w-36 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all" />
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
              <Bell size={16} className="text-slate-500" />
              {(overdue.length + awaitReview.length) > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">

        {/* ═══ DASHBOARD ═══ */}
        {view === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">สวัสดี, ทีม Digicon</h1>
              <p className="text-slate-400 text-sm mt-1">{todayDate.getDate()} {TH_MONTHS[todayDate.getMonth()]} {todayDate.getFullYear() + 543}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "งานเลยกำหนด", value: overdue.length,     icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100"    },
                { label: "ส่งใน 2 วัน",  value: dueSoon.length,     icon: Clock,         color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100"  },
                { label: "รอตรวจงาน",    value: awaitReview.length, icon: Eye,           color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
                { label: "คลิปทั้งหมด",  value: allClips.length,    icon: Film,          color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200"  },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4 flex flex-col gap-3`}>
                    <Icon size={20} className={card.color} />
                    <div><div className="text-3xl font-bold text-slate-800">{card.value}</div><div className="text-xs text-slate-500 mt-0.5">{card.label}</div></div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Target size={16} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-800 text-sm">งานที่ต้องส่งวันนี้</h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{dueToday.length}</span>
              </div>
              {dueToday.length === 0 ? (
                <div className="py-12 text-center"><CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" /><p className="text-slate-400 text-sm">ไม่มีงานที่ต้องส่งวันนี้</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {dueToday.map(clip => {
                    const editor = editors.find(e => e.id === clip.editorId);
                    return (
                      <div key={clip.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                        <Avatar editor={editor} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p>
                          <p className="text-xs text-slate-400 truncate">{clip.projectName}</p>
                        </div>
                        <StatusBadge status={clip.status} />
                        <button onClick={() => openGCal(`[Digicon] ตามงาน: ${clip.name}`, todayDate.toISOString().split("T")[0], `โปรเจกต์: ${clip.projectName}`)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium">
                          <CalendarPlus size={13} />ตามงาน
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {overdue.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-500" />
                    <h2 className="font-semibold text-red-700 text-sm">งานเลยกำหนด ({overdue.length} รายการ)</h2>
                  </div>
                  <button onClick={() => { overdue.slice(0, 5).forEach((c, i) => setTimeout(() => openGCal(`[Digicon] ⚠ ตามงานด่วน: ${c.name}`, todayDate.toISOString().split("T")[0], `โปรเจกต์: ${c.projectName}\nDeadline เดิม: ${fmtDate(c.deadline)}`), i * 400)); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium">
                    <CalendarPlus size={13} />ตามงานทั้งหมด
                  </button>
                </div>
                <div className="divide-y divide-red-100">
                  {overdue.slice(0, 5).map(clip => {
                    const editor = editors.find(e => e.id === clip.editorId);
                    const days = Math.round((todayDate - new Date(clip.deadline)) / 86400000);
                    return (
                      <div key={clip.id} className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
                        <Avatar editor={editor} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{clip.name}</p>
                          <p className="text-xs text-red-500">เลยกำหนด {days} วัน · {clip.projectName}</p>
                        </div>
                        <StatusBadge status={clip.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALENDAR ═══ */}
        {view === "calendar" && <CalendarView allClips={allClips} editors={editors} />}

        {/* ═══ MANAGEMENT ═══ */}
        {view === "management" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold text-slate-800">จัดการโปรเจกต์</h1><p className="text-slate-500 text-sm mt-1">{projects.length} ลูกค้า · {allClips.length} คลิป</p></div>
              <button onClick={() => setAddingProj(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-2xl transition-colors">
                <Plus size={16} /><span className="hidden sm:inline">เพิ่มลูกค้า</span>
              </button>
            </div>

            {addingProj && (
              <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 text-sm">เพิ่มลูกค้าใหม่</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[{ k: "client", l: "ชื่อลูกค้า / บริษัท", ph: "เช่น บริษัท ABC จำกัด" }, { k: "pm", l: "Project Manager", ph: "ชื่อ PM" }, { k: "broker", l: "นายหน้า", ph: "ชื่อนายหน้า" }].map(f => (
                    <div key={f.k}><label className="block text-xs text-slate-500 mb-1">{f.l}</label>
                      <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder={f.ph} value={newProj[f.k]} onChange={e => setNewProj(p => ({ ...p, [f.k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddingProj(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">ยกเลิก</button>
                  <button onClick={handleAddProj} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors">บันทึก</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.filter(p => !search || p.client.toLowerCase().includes(search.toLowerCase())).map(project => {
                const progress = getProgress(project.clips);
                const pOver = project.clips.filter(c => c.status !== "completed" && new Date(c.deadline) < todayDate);
                const isEditP = editingProj === project.id;

                return (
                  <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all group">
                    {isEditP ? (
                      <div className="space-y-2 mb-3">
                        {[{ k: "client", l: "ชื่อลูกค้า" }, { k: "pm", l: "PM" }, { k: "broker", l: "นายหน้า" }].map(f => (
                          <div key={f.k}><label className="text-xs text-slate-400">{f.l}</label>
                            <input className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mt-0.5" value={editProjData[f.k] || ""} onChange={e => setEditProjData(p => ({ ...p, [f.k]: e.target.value }))} />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveEditProj} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"><Save size={12} />บันทึก</button>
                          <button onClick={() => setEditingProj(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">ยกเลิก</button>
                        </div>
                      </div>
                    ) : (
                      <div className="cursor-pointer" onClick={() => { setSelProj(project); setView("project"); }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 text-sm truncate group-hover:text-indigo-700 transition-colors">{project.client}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">สร้างเมื่อ {fmtDate(project.createdAt)}</p>
                          </div>
                          {pOver.length > 0 && <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0">เลยกำหนด {pOver.length}</span>}
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500">ความคืบหน้า</span>
                            <span className={`font-bold ${progress === 100 ? "text-emerald-600" : "text-indigo-600"}`}>{progress}%</span>
                          </div>
                          <ProgressBar value={progress} />
                          <p className="text-xs text-slate-400 mt-1.5">เสร็จแล้ว {project.clips.filter(c => c.status === "completed").length} จาก {project.clips.length} คลิป</p>
                        </div>
                        <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-2 text-xs mb-3">
                          <div><p className="text-slate-400">PM</p><p className="font-medium text-slate-600 truncate">{project.pm || "—"}</p></div>
                          <div><p className="text-slate-400">นายหน้า</p><p className="font-medium text-slate-600 truncate">{project.broker || "—"}</p></div>
                        </div>
                      </div>
                    )}

                    {!isEditP && (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex -space-x-1.5 cursor-pointer" onClick={() => { setSelProj(project); setView("project"); }}>
                          {[...new Set(project.clips.map(c => c.editorId))].slice(0, 4).map(eid => {
                            const ed = editors.find(e => e.id === eid);
                            return ed ? <Avatar key={eid} editor={ed} size="sm" /> : null;
                          })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setGcalModal(project)}
                            className="flex items-center gap-1 text-xs px-2 py-1.5 border border-slate-200 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium">
                            <CalendarDays size={13} />Calendar
                          </button>
                          <button onClick={() => startEditProj(project)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => setConfirmDel({ type: "project", id: project.id })} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PROJECT DETAIL ═══ */}
        {view === "project" && currentProject && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => { setView("management"); setSelProj(null); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500"><ArrowLeft size={18} /></button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-800 truncate">{currentProject.client}</h1>
                <p className="text-slate-500 text-xs">PM: {currentProject.pm} · นายหน้า: {currentProject.broker}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setGcalModal(currentProject)}
                  className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium">
                  <CalendarDays size={14} />Calendar
                </button>
                <button onClick={() => setAddingClip(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-2xl transition-colors">
                  <Plus size={16} /><span className="hidden sm:inline">เพิ่มคลิป</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <ProgressBar value={getProgress(currentProject.clips)} />
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>เสร็จสิ้น {currentProject.clips.filter(c => c.status === "completed").length} คลิป</span>
                <span>ทั้งหมด {currentProject.clips.length} คลิป</span>
              </div>
            </div>

            {addingClip && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-indigo-800">เพิ่มคลิปใหม่</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm col-span-1 sm:col-span-2 lg:col-span-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    placeholder="ชื่อคลิป..." value={newClip.name} onChange={e => setNewClip(p => ({ ...p, name: e.target.value }))} />
                  <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={newClip.editorId} onChange={e => setNewClip(p => ({ ...p, editorId: e.target.value }))}>
                    <option value="">เลือกคนตัดต่อ</option>
                    {editors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <DatePicker value={newClip.deadline} onChange={v => setNewClip(p => ({ ...p, deadline: v }))} placeholder="เลือก Deadline" />
                  <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={newClip.status} onChange={e => setNewClip(p => ({ ...p, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <MessageSquare size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="หมายเหตุ..." value={newClip.note} onChange={e => setNewClip(p => ({ ...p, note: e.target.value }))} />
                  </div>
                  <div className="relative">
                    <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="Link งาน (Drive/Frame.io)..." value={newClip.link} onChange={e => setNewClip(p => ({ ...p, link: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddingClip(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">ยกเลิก</button>
                  <button onClick={handleAddClip} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors">เพิ่มคลิป</button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ชื่อคลิป</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">คนตัดต่อ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Deadline</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">หมายเหตุ / Link</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentProject.clips.map(clip => {
                      const editing = editingClip === clip.id;
                      const editor = editors.find(e => e.id === clip.editorId);
                      const isOver = clip.status !== "completed" && new Date(clip.deadline) < todayDate;
                      return (
                        <tr key={clip.id} className={`hover:bg-slate-50 transition-colors ${editing ? "bg-indigo-50/40" : ""}`}>
                          <td className="px-4 py-3">
                            {editing ? (
                              <input className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                defaultValue={clip.name} autoFocus
                                onBlur={e => updateClip(currentProject.id, clip.id, { name: e.target.value })} />
                            ) : <span className="font-medium text-slate-700">{clip.name}</span>}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {editing ? (
                              <select className="border border-indigo-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none w-32"
                                value={clip.editorId || ""}
                                onChange={e => updateClip(currentProject.id, clip.id, { editorId: e.target.value ? parseInt(e.target.value) : null })}>
                                <option value="">ไม่ระบุ</option>
                                {editors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Avatar editor={editor} size="sm" />
                                <span className="text-xs text-slate-600">{editor ? editor.name : "ไม่ระบุ"}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {editing ? (
                              <DatePicker value={clip.deadline} onChange={v => updateClip(currentProject.id, clip.id, { deadline: v })} />
                            ) : (
                              <span className={`text-xs font-medium ${isOver ? "text-red-500" : "text-slate-500"}`}>{fmtDate(clip.deadline)}{isOver ? " ⚠" : ""}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select className="text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                              value={clip.status} onChange={e => updateClip(currentProject.id, clip.id, { status: e.target.value })}>
                              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {editing ? (
                              <div className="space-y-1.5">
                                <input className="w-full border border-indigo-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                                  placeholder="หมายเหตุ..." defaultValue={clip.note}
                                  onBlur={e => updateClip(currentProject.id, clip.id, { note: e.target.value })} />
                                <input className="w-full border border-indigo-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                                  placeholder="Link งาน..." defaultValue={clip.link}
                                  onBlur={e => updateClip(currentProject.id, clip.id, { link: e.target.value })} />
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                {clip.note && <p className="text-xs text-slate-500 truncate max-w-[180px]" title={clip.note}><MessageSquare size={10} className="inline mr-1 text-slate-400" />{clip.note}</p>}
                                {clip.link && (
                                  <a href={clip.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 truncate max-w-[180px]">
                                    <Link2 size={10} />เปิดลิงก์
                                  </a>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditingClip(editing ? null : clip.id)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${editing ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-400"}`}>
                                {editing ? <Check size={13} /> : <Edit2 size={13} />}
                              </button>
                              <button onClick={() => setConfirmDel({ type: "clip", id: clip.id, projId: currentProject.id })}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-500 text-slate-300 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {currentProject.clips.length === 0 && (
                  <div className="py-16 text-center">
                    <Film size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">ยังไม่มีคลิปในโปรเจกต์นี้</p>
                    <button onClick={() => setAddingClip(true)} className="mt-3 text-indigo-600 text-sm hover:underline">+ เพิ่มคลิปแรก</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ EDITORS LIST ═══ */}
        {view === "editors" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold text-slate-800">ทีมตัดต่อ</h1><p className="text-slate-500 text-sm mt-1">{editors.length} คน</p></div>
              <button onClick={addEditor} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-2xl transition-colors">
                <Plus size={16} /><span className="hidden sm:inline">เพิ่มคนตัดต่อ</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editors.map(editor => {
                const ec = allClips.filter(c => c.editorId === editor.id);
                const done = ec.filter(c => c.status === "completed").length;
                const inProg = ec.filter(c => c.status === "in_progress").length;
                const ov = ec.filter(c => c.status !== "completed" && new Date(c.deadline) < todayDate);
                const wl = ec.length;
                const isEditE = editingEditorId === editor.id;

                return (
                  <div key={editor.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar editor={editor} size="lg" />
                      <div className="flex-1 min-w-0">
                        {isEditE ? (
                          <div className="flex items-center gap-2">
                            <input autoFocus className="flex-1 border border-indigo-300 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              value={editEditorName} onChange={e => setEditEditorName(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEditorName(editor.id); if (e.key === "Escape") setEditingEditorId(null); }} />
                            <button onClick={() => saveEditorName(editor.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white"><Check size={13} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 cursor-pointer" onClick={() => { setSelEditor(editor); setView("editor"); }}>{editor.name}</h3>
                            <button onClick={() => { setEditingEditorId(editor.id); setEditEditorName(editor.name); }}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-slate-400">คนตัดต่อ</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ov.length > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">เลยกำหนด {ov.length}</span>}
                        <button onClick={() => setConfirmDel({ type: "editor", id: editor.id })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors cursor-pointer" onClick={() => { setSelEditor(editor); setView("editor"); }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[{ l: "ทั้งหมด", v: wl, c: "text-slate-700" }, { l: "กำลังทำ", v: inProg, c: "text-indigo-600" }, { l: "เสร็จแล้ว", v: done, c: "text-emerald-600" }].map(s => (
                        <div key={s.l} className="bg-slate-50 rounded-xl p-2.5 text-center">
                          <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>ภาระงาน</span>
                        <span className={`font-semibold ${wl >= 8 ? "text-red-500" : wl >= 5 ? "text-amber-500" : "text-emerald-600"}`}>{wl >= 8 ? "หนักมาก" : wl >= 5 ? "ปานกลาง" : "ปกติ"}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${wl >= 8 ? "bg-red-400" : wl >= 5 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.min(wl / 10 * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ EDITOR DETAIL ═══ */}
        {view === "editor" && selEditor && (() => {
          const editorData = editors.find(e => e.id === selEditor.id) || selEditor;
          const ec = allClips.filter(c => c.editorId === selEditor.id);
          const overdueEc = ec.filter(c => c.status !== "completed" && new Date(c.deadline) < todayDate);
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={() => { setView("editors"); setSelEditor(null); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500"><ArrowLeft size={18} /></button>
                <Avatar editor={editorData} size="lg" />
                <div className="flex-1"><h1 className="text-xl font-bold text-slate-800">{editorData.name}</h1><p className="text-slate-500 text-xs">รายการงานที่รับผิดชอบ</p></div>
                {overdueEc.length > 0 && (
                  <button onClick={() => overdueEc.slice(0, 5).forEach((c, i) => setTimeout(() => openGCal(`[Digicon] ⚠ ตามงาน ${editorData.name}: ${c.name}`, todayDate.toISOString().split("T")[0], `โปรเจกต์: ${c.projectName}\nDeadline เดิม: ${fmtDate(c.deadline)}`), i * 400))}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium">
                    <CalendarPlus size={13} />ตามงานที่เลยกำหนด
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {STATUSES.map(s => (
                  <div key={s.value} className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-bold text-slate-800">{ec.filter(c => c.status === s.value).length}</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800 text-sm">คลิปทั้งหมด ({ec.length} รายการ)</h2></div>
                {ec.length === 0 ? (
                  <div className="py-16 text-center"><Film size={32} className="text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">ยังไม่มีงานที่รับผิดชอบ</p></div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ec.map(clip => {
                      const isOver = clip.status !== "completed" && new Date(clip.deadline) < todayDate;
                      return (
                        <div key={clip.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                          <div className={`w-2 h-10 rounded-full shrink-0 ${clip.status === "completed" ? "bg-emerald-400" : clip.status === "in_progress" ? "bg-indigo-400" : clip.status === "review" ? "bg-amber-400" : isOver ? "bg-red-400" : "bg-slate-200"}`} />
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { const proj = projects.find(p => p.id === clip.projectId); setSelProj(proj); setView("project"); }}>
                            <p className="font-medium text-slate-800 text-sm truncate">{clip.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{clip.projectName}</p>
                            {clip.note && <p className="text-xs text-slate-400 mt-0.5 truncate italic">{clip.note}</p>}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <StatusBadge status={clip.status} />
                            <p className={`text-xs ${isOver ? "text-red-500 font-medium" : "text-slate-400"}`}>{fmtDate(clip.deadline)}{isOver ? " ⚠" : ""}</p>
                          </div>
                          {clip.link && (
                            <a href={clip.link} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
                              <ExternalLink size={13} />
                            </a>
                          )}
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
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button key={item.id} onClick={() => navGo(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors ${active ? "text-indigo-600" : "text-slate-400"}`}>
                <Icon size={19} />
                <span className="text-xs font-medium">{item.label}</span>
                {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-b-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
