import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/ai-clipper")({
  component: AiClipperPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type MomentType = "funny" | "jump_scare" | "kill" | "death" | "argument" | "laugh" | "fail" | "win" | "boss_fight";
type ExportFormat = "tiktok" | "reels" | "shorts" | "square" | "landscape";

const MOMENT_CONFIG: { type: MomentType; label: string; icon: string; color: string }[] = [
  { type: "funny", label: "Funny Moments", icon: "😂", color: "yellow" },
  { type: "jump_scare", label: "Jump Scares", icon: "😱", color: "purple" },
  { type: "kill", label: "Kills", icon: "💀", color: "red" },
  { type: "death", label: "Deaths", icon: "💔", color: "rose" },
  { type: "argument", label: "Arguments", icon: "🗣️", color: "orange" },
  { type: "laugh", label: "Laughs", icon: "🤣", color: "green" },
  { type: "fail", label: "Fails", icon: "😅", color: "amber" },
  { type: "win", label: "Wins", icon: "🏆", color: "indigo" },
  { type: "boss_fight", label: "Boss Fights", icon: "⚔️", color: "violet" },
];

const EXPORT_FORMATS: { id: ExportFormat; label: string; icon: string; resolution: string }[] = [
  { id: "tiktok", label: "TikTok", icon: "🎵", resolution: "1080×1920" },
  { id: "reels", label: "Reels", icon: "📸", resolution: "1080×1920" },
  { id: "shorts", label: "Shorts", icon: "▶️", resolution: "1080×1920" },
  { id: "square", label: "Square", icon: "⬜", resolution: "1080×1080" },
  { id: "landscape", label: "Landscape", icon: "🖥️", resolution: "1920×1080" },
];

// Demo detected moments
const DEMO_MOMENTS = [
  { type: "funny" as MomentType, timestamp: "2:34", duration: "15s", preview: "Controller throw after losing to tutorial boss", confidence: 94 },
  { type: "jump_scare" as MomentType, timestamp: "7:12", duration: "8s", preview: "Jump scare from unexpected enemy spawn", confidence: 91 },
  { type: "kill" as MomentType, timestamp: "15:45", duration: "12s", preview: "Triple kill combo in boss fight", confidence: 88 },
  { type: "fail" as MomentType, timestamp: "21:08", duration: "10s", preview: "Failed epic jump attempt", confidence: 96 },
  { type: "laugh" as MomentType, timestamp: "28:33", duration: "20s", preview: "Reaction to chat's trolling", confidence: 85 },
  { type: "win" as MomentType, timestamp: "35:00", duration: "18s", preview: "Final boss defeated with 1 HP remaining", confidence: 97 },
  { type: "boss_fight" as MomentType, timestamp: "42:15", duration: "25s", preview: "Intense boss fight climax", confidence: 82 },
  { type: "argument" as MomentType, timestamp: "48:50", duration: "14s", preview: "Debating with chat about game mechanics", confidence: 78 },
  { type: "death" as MomentType, timestamp: "55:22", duration: "6s", preview: "Death by falling off map", confidence: 90 },
];

// ─── AI Clipper Component ────────────────────────────────────────────────────

function AiClipperPage() {
  const [connectedSources, setConnectedSources] = useState<Record<string, boolean>>({
    kick: false,
    twitch: false,
    youtube: false,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedMoments, setSelectedMoments] = useState<MomentType[]>(["funny", "fail", "win", "laugh"]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("shorts");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [detectedMoments, setDetectedMoments] = useState<typeof DEMO_MOMENTS>([]);

  const toggleMomentType = (type: MomentType) => {
    setSelectedMoments((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleConnect = (source: string) => {
    setConnectedSources((prev) => ({ ...prev, [source]: true }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Simulate detection
      setDetectedMoments(DEMO_MOMENTS);
    }
  };

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    setGenerated(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          setGenerated(true);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const hasSource = Object.values(connectedSources).some(Boolean) || uploadedFile;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">✂️ AI Clipper</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Auto-generate clips from your VODs with AI-powered moment detection.
        </p>
      </div>

      {/* ── Source Connection ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform connections */}
        <div className="widget-card">
          <h3 className="widget-header">🔗 Connect VOD Source</h3>
          <div className="space-y-3 mt-4">
            {[
              { id: "twitch", label: "Twitch", icon: "🟣" },
              { id: "kick", label: "Kick", icon: "⚡" },
              { id: "youtube", label: "YouTube", icon: "▶️" },
            ].map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{source.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{source.label}</span>
                </div>
                {connectedSources[source.id] ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Connected
                  </span>
                ) : (
                  <button onClick={() => handleConnect(source.id)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    + Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div className="widget-card">
          <h3 className="widget-header">📁 Upload VOD</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Or upload a pre-recorded video for AI analysis</p>
          <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/30">
            {uploadedFile ? (
              <div className="text-center">
                <div className="text-3xl mb-2">🎬</div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">📤</div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Drop your VOD here</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">or click to browse (MP4, MOV, AVI)</p>
              </>
            )}
            <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* ── Moment Type Selector ───────────────────────────────── */}
      {hasSource && (
        <div className="widget-card">
          <h3 className="widget-header">🎯 Detect Moments</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Select the types of moments you want AI to detect</p>
          <div className="flex flex-wrap gap-2">
            {MOMENT_CONFIG.map((moment) => (
              <button
                key={moment.type}
                onClick={() => toggleMomentType(moment.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedMoments.includes(moment.type)
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700"
                    : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span>{moment.icon}</span>
                {moment.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Export Format ─────────────────────────────────────── */}
      {hasSource && (
        <div className="widget-card">
          <h3 className="widget-header">📱 Export Format</h3>
          <div className="flex flex-wrap gap-2 mt-4">
            {EXPORT_FORMATS.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setExportFormat(fmt.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  exportFormat === fmt.id
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700"
                    : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-lg">{fmt.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-medium">{fmt.label}</p>
                  <p className="text-[10px] opacity-60">{fmt.resolution}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Generate Button ───────────────────────────────────── */}
      {hasSource && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          {generating ? (
            <><Spinner /> Generating Clips...</>
          ) : generated ? (
            <><span>✨</span> Regenerate Clips</>
          ) : (
            <><span>✂️</span> Generate Clips</>
          )}
        </button>
      )}

      {/* ── Progress Bar ──────────────────────────────────────── */}
      {generating && (
        <div className="widget-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Processing...</span>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {progress < 30 ? "Scanning VOD for moments..." : progress < 60 ? "Detecting highlights..." : progress < 90 ? "Trimming clips..." : "Finalizing exports..."}
          </p>
        </div>
      )}

      {/* ── Detected Moments ──────────────────────────────────── */}
      {detectedMoments.length > 0 && (generated || generating) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🎬 Detected Moments</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{detectedMoments.length} moments found</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {detectedMoments.map((moment, i) => {
              const config = MOMENT_CONFIG.find((m) => m.type === moment.type)!;
              return (
                <div
                  key={i}
                  className="widget-card hover:ring-1 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{config.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                      {moment.confidence}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{moment.preview}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>⏱ {moment.timestamp}</span>
                    <span>⏳ {moment.duration}</span>
                  </div>
                  {generated && (
                    <div className="mt-2 flex gap-1.5">
                      <button className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all">
                        Preview
                      </button>
                      <button className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all">
                        Download
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasSource && (
        <div className="widget-card flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">✂️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connect a VOD source to get started</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect your Twitch, Kick, or YouTube account, or upload a VOD file directly. AI will automatically detect the best moments to clip.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}