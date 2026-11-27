// src/components/ViewDoc.jsx
import { useMemo } from "react";

function groupByDate(entries) {
  const groups = {};
  for (const e of entries) {
    const key = e.date || "Unknown Date";
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  // Sort dates descending
  return Object.entries(groups).sort(([a], [b]) => (b > a ? 1 : -1));
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === "Unknown Date") return "Unknown Date";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  try {
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m));
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return timeStr;
  }
}

// Generate a soft color for each subject tag
const subjectColors = [
  "bg-indigo-900/60 text-indigo-300 border-indigo-700",
  "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  "bg-amber-900/60 text-amber-300 border-amber-700",
  "bg-pink-900/60 text-pink-300 border-pink-700",
  "bg-cyan-900/60 text-cyan-300 border-cyan-700",
  "bg-violet-900/60 text-violet-300 border-violet-700",
];
const colorMap = {};
let colorIdx = 0;
function subjectColor(subject) {
  if (!colorMap[subject]) {
    colorMap[subject] = subjectColors[colorIdx % subjectColors.length];
    colorIdx++;
  }
  return colorMap[subject];
}

export default function ViewDoc({ entries, error, onClose }) {
  const grouped = useMemo(() => groupByDate(entries), [entries]);

  // Subject summary
  const subjectSummary = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (e.subject) map[e.subject] = (map[e.subject] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 w-full sm:max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">📄 My Activity Log</h2>
            <p className="text-slate-400 text-xs mt-0.5">{entries.length} entries total</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error notification if Firestore has issues */}
        {error && (
          <div className="px-5 py-2.5 bg-amber-950/60 border-b border-amber-800 text-amber-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>Firestore note: {error}. Check Firebase Console Firestore Rules.</span>
          </div>
        )}

        {/* Subject chips summary */}
        {subjectSummary.length > 0 && (
          <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-slate-800 flex-shrink-0">
            {subjectSummary.map(([subj, count]) => (
              <span
                key={subj}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${subjectColor(subj)}`}
              >
                {subj} · {count}
              </span>
            ))}
          </div>
        )}

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm">No entries yet. Start logging in the chat!</p>
            </div>
          ) : (
            grouped.map(([date, dayEntries]) => (
              <div key={date}>
                {/* Date heading */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-slate-700" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {formatDate(date)}
                  </span>
                  <div className="h-px flex-1 bg-slate-700" />
                </div>

                {/* Entries for that day */}
                <div className="flex flex-col gap-3">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-slate-800/90 rounded-2xl p-4 flex flex-col gap-2.5 border border-slate-700 shadow-md transition-all hover:border-slate-600"
                    >
                      {/* Prominent Date, Time & Subject Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-600/50 px-2.5 py-1 rounded-lg">
                            <span>📅</span>
                            <span>{formatDate(entry.date || date)}</span>
                          </span>
                          {entry.time && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-600/50 px-2.5 py-1 rounded-lg">
                              <span>⏰</span>
                              <span>{formatTime(entry.time)}</span>
                            </span>
                          )}
                        </div>
                        {entry.subject && (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${subjectColor(
                              entry.subject
                            )}`}
                          >
                            🏷️ {entry.subject}
                          </span>
                        )}
                      </div>

                      {/* Keywords Action Block */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider flex-shrink-0">
                          Keywords:
                        </span>
                        <span className="text-white text-base font-bold tracking-tight">
                          {entry.activity}
                        </span>
                      </div>

                      {/* Original raw note if available */}
                      {entry.raw && (
                        <div className="text-slate-400 text-xs italic bg-slate-900/50 rounded-lg px-3 py-1.5 border border-slate-800">
                          <span className="text-slate-500 font-semibold not-italic">Input: </span>"{entry.raw}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
