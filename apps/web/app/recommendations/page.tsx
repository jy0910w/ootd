"use client";

import { ChangeEvent, useRef, useState } from "react";
import { api, VisualRecommendationResponse } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { MvpNav } from "@/components/mvp-nav";
import { SessionState } from "@/lib/session";
import { Upload, Sparkles, X } from "lucide-react";

export default function RecommendationsPage() {
  return <RequireAuth>{(session) => <RecommendationsContent session={session} />}</RequireAuth>;
}

const DUMMY_CARDS = [
  { idx: "01", title: "街頭休閒組合", desc: "白色 Tee × 牛仔外套 × 黑色長褲 × 白色運動鞋", tags: ["#街頭", "#休閒"] },
  { idx: "02", title: "自然系層搭", desc: "森林綠針織 × 米色風衣 × 黑色長褲", tags: ["#自然", "#層搭"] },
  { idx: "03", title: "極簡黑白", desc: "白色 Tee × 黑色長褲 × 白色運動鞋", tags: ["#極簡", "#黑白"] }
];

function RecommendationsContent({ session }: { session: SessionState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisualRecommendationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setErrorMessage("");
  }

  function clearFile() {
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await api.visualRecommend(selectedFile);
      setResult(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "推薦查詢失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MvpNav session={session} />

      <div className="pt-14 min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10">

          {/* Header */}
          <div className="py-8 border-b border-gray-200 dark:border-gray-800 mb-8">
            <p className="text-xs tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">AI Stylist</p>
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 dark:text-white leading-none tracking-tight">
              穿搭推薦
            </h1>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 pb-16">

            {/* Left: upload panel */}
            <div className="space-y-6">
              <div className="rounded-lg p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4">上傳穿搭照</p>

                {/* Drop zone */}
                <label className={`block rounded-lg cursor-pointer transition-all ${previewUrl ? "" : "dropzone p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-700"}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {previewUrl ? (
                    <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: 260 }}>
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center btn-ghost"
                        onClick={(e) => { e.preventDefault(); clearFile(); }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">上傳穿搭照</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">JPG、PNG、WEBP</p>
                    </>
                  )}
                </label>

                <button
                  type="button"
                  disabled={!selectedFile || loading}
                  onClick={() => void handleAnalyze()}
                  className="btn-primary w-full h-10 rounded-lg mt-4 text-xs tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Sparkles size={12} />
                  {loading ? "AI 分析中..." : "查詢推薦"}
                </button>
              </div>

              {/* Analysis summary */}
              {result && (
                <div className="rounded-lg p-5 bg-brand-500/10 border border-brand-500/20 dark:border-brand-500/30">
                  <p className="text-xs tracking-widest text-brand-600 dark:text-brand-400 uppercase mb-3">AI 分析結果</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="tag-pill px-2 py-0.5 rounded-full text-xs">{result.analysis.occasion}</span>
                    <span className="tag-pill px-2 py-0.5 rounded-full text-xs">{result.analysis.season}</span>
                    {result.analysis.styleHints.map((h) => (
                      <span key={h} className="tag-pill px-2 py-0.5 rounded-full text-xs">{h}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{result.analysis.colorPalette}</p>
                </div>
              )}
            </div>

            {/* Right: results */}
            <div>
              {result ? (
                result.results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <p className="text-3xl font-light text-gray-300 dark:text-gray-700 mb-2 italic">
                      尚無符合推薦
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">資料庫中暫無符合此風格的穿搭</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {result.results.map((r, i) => (
                      <div
                        key={r.outfitId}
                        className="rec-card rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                      >
                        <div className="relative" style={{ height: "220px" }}>
                          <img
                            src={`https://placehold.co/500x625/1a1a1a/00D4AA?text=.`}
                            alt={`推薦穿搭 ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span className="text-4xl font-light text-white/20 leading-none">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-xl font-light text-gray-900 dark:text-white italic">
                            穿搭組合 {i + 1}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                            {r.reasons.join("、") || "AI 智慧推薦"}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Score: {r.score.toFixed(2)}</p>
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button className="btn-primary flex-1 h-9 rounded-lg text-xs tracking-widest uppercase">採用</button>
                            <button className="btn-ghost flex-1 h-9 rounded-lg text-xs tracking-widest uppercase">略過</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Placeholder cards before query */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {DUMMY_CARDS.map((card) => (
                    <div
                      key={card.idx}
                      className="rec-card rounded-lg overflow-hidden opacity-40 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                    >
                      <div className="relative" style={{ height: "220px" }}>
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-900" />
                        <div className="absolute top-3 left-3">
                          <span className="text-4xl font-light text-gray-400 dark:text-gray-600 opacity-20 leading-none">
                            {card.idx}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-xl font-light text-gray-900 dark:text-white italic">{card.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
                        <div className="flex gap-1.5 mt-3">
                          {card.tags.map((tag) => (
                            <span key={tag} className="tag-pill px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                          <button disabled className="btn-primary flex-1 h-9 rounded-lg text-xs tracking-widest uppercase opacity-50">採用</button>
                          <button disabled className="btn-ghost flex-1 h-9 rounded-lg text-xs tracking-widest uppercase">略過</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
