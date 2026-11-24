// src/components/ExportModal.jsx
import { useMemo, useState } from "react";

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

function generateReportHtml(entries, user) {
  const generatedDate = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  // Group by date
  const groups = {};
  for (const e of entries) {
    const key = e.date || "Unknown Date";
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  const sortedDates = Object.entries(groups).sort(([a], [b]) => (b > a ? 1 : -1));

  // Subject counts
  const subjMap = {};
  for (const e of entries) {
    if (e.subject) subjMap[e.subject] = (subjMap[e.subject] || 0) + 1;
  }
  const subjectRows = Object.entries(subjMap)
    .sort((a, b) => b[1] - a[1])
    .map(([s, c]) => `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:4px 10px;border-radius:12px;margin:3px;font-size:12px;font-weight:600;">${s}: ${c}</span>`)
    .join(" ");

  const entriesHtml = sortedDates
    .map(([date, dayEntries]) => {
      const rows = dayEntries
        .map(
          (e) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;font-size:13px;color:#64748b;white-space:nowrap;vertical-align:top;">${formatTime(e.time) || "—"}</td>
          <td style="padding:10px;font-size:13px;vertical-align:top;">
            <strong style="display:inline-block;background:#f1f5f9;color:#0f172a;padding:2px 8px;border-radius:6px;font-size:11px;border:1px solid #cbd5e1;">${e.subject || "General"}</strong>
          </td>
          <td style="padding:10px;font-size:13px;color:#1e293b;vertical-align:top;">
            <div style="font-weight:500;">${e.activity || ""}</div>
            ${e.raw ? `<div style="font-size:11px;color:#94a3b8;font-style:italic;margin-top:4px;">"${e.raw}"</div>` : ""}
          </td>
        </tr>
      `
        )
        .join("");

      return `
        <div style="margin-top:24px;">
          <h3 style="color:#1e1b4b;border-bottom:2px solid #6366f1;padding-bottom:6px;margin-bottom:10px;font-size:16px;">
            📅 ${formatDate(date)}
          </h3>
          <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;text-align:left;font-size:12px;color:#475569;">
                <th style="padding:10px;width:90px;">TIME</th>
                <th style="padding:10px;width:120px;">SUBJECT</th>
                <th style="padding:10px;">ACTIVITY</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Activity Log - ${user?.displayName || user?.email || "User"}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px 20px;
            line-height: 1.5;
          }
          @media print {
            body { padding: 0; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div style="border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:20px;">
          <h1 style="margin:0 0 6px 0;color:#1e1b4b;font-size:26px;">📋 Personal Activity Tracker Log</h1>
          <div style="font-size:13px;color:#64748b;">
            <span>User: <strong>${user?.displayName || user?.email}</strong></span> &nbsp;·&nbsp;
            <span>Generated: <strong>${generatedDate}</strong></span> &nbsp;·&nbsp;
            <span>Total Entries: <strong>${entries.length}</strong></span>
          </div>
        </div>

        ${subjectRows ? `<div style="margin-bottom:20px;"><div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;">Subjects Summary:</div>${subjectRows}</div>` : ""}

        ${entriesHtml || "<p style='color:#94a3b8;font-style:italic;'>No entries logged yet.</p>"}

        <div style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center;">
          Generated with Tracker App powered by Gemini AI
        </div>
      </body>
    </html>
  `;
}

export default function ExportModal({ entries, user, onClose }) {
  const [downloadedDoc, setDownloadedDoc] = useState(false);

  // Export as Word Doc (.doc) - Google Docs compatible
  function handleExportDoc() {
    const html = generateReportHtml(entries, user);
    const blob = new Blob(["\ufeff", html], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `Activity_Log_${new Date().toISOString().slice(0, 10)}.doc`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedDoc(true);
  }

  // Export as PDF via Print dialog
  function handleExportPdf() {
    const html = generateReportHtml(entries, user);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the PDF.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl flex flex-col overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">📥</span>
            <h2 className="text-white font-bold text-lg">Export Activity Log</h2>
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

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 text-xs text-slate-300">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400">Total Activities to export:</span>
              <span className="font-bold text-white text-sm">{entries.length} entries</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Account:</span>
              <span className="text-indigo-300 font-medium">{user?.email}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Download Doc */}
            <button
              onClick={handleExportDoc}
              className="w-full flex items-center justify-between px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-md group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📄</span>
                <div className="text-left">
                  <div className="font-semibold">Download Google Doc (.doc)</div>
                  <div className="text-xs text-indigo-200">Formatted document for Google Drive / Docs</div>
                </div>
              </div>
              <span className="text-indigo-200 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Print / Save as PDF */}
            <button
              onClick={handleExportPdf}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-sm transition-all border border-slate-700 group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🖨️</span>
                <div className="text-left">
                  <div className="font-semibold">Export as PDF</div>
                  <div className="text-xs text-slate-400">Print or choose "Save as PDF" / "Save to Drive"</div>
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Google Drive Shortcut Info */}
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/60 text-xs text-slate-400 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-400 font-medium">
              <span>☁️</span>
              <span>Save into your Google Drive:</span>
            </div>
            <p className="leading-relaxed">
              Once downloaded, you can drop the <code className="text-indigo-300 font-mono">.doc</code> file straight into your Google Drive root, or select <strong>Save to Google Drive</strong> in the PDF destination menu.
            </p>
            {downloadedDoc && (
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 mt-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium py-2 rounded-lg transition-colors"
              >
                <span>📂</span>
                <span>Open Google Drive Root</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
