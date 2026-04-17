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

      <div className="pt-14 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10">

          {/* Header */}
          <div className="py-8 border-b hairline mb-8">
            <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-1">AI Stylist</p>
            <h1 className="font-display text-5xl md:text-6xl font-light text-cream" style={{ lineHeight: 1, letterSpacing: "-0.04em" }}>
              穿搭推薦
            </h1>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded text-xs" style={{ background: "rgba(182,59,54,0.12)", border: "1px solid rgba(182,59,54,0.3)", color: "#e07b77" }}>
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 pb-16">

            {/* Left: upload panel */}
            <div className="space-y-6">
              <div
                className="rounded p-5"
                style={{ background: "rgba(26,26,23,0.8)", border: "1px solid rgba(245,240,235,0.06)" }}
              >
                <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-4">上傳穿搭照</p>

                {/* Drop zone */}
                <label className={`block rounded-lg cursor-pointer transition-all ${previewUrl ? "" : "dropzone p-10 text-center"}`}
                  style={previewUrl ? {} : { border: "1px dashed rgba(245,240,235,0.12)" }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {previewUrl ? (
                    <div className="relative rounded overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: 260 }}>
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
                      <Upload size={28} className="mx-auto mb-3 text-cream opacity-20" />
                      <p className="text-sm text-cream opacity-40 mb-1">上傳穿搭照</p>
                      <p className="text-xs text-cream opacity-20">JPG、PNG、WEBP</p>
                    </>
                  )}
                </label>

                <button
                  type="button"
                  disabled={!selectedFile || loading}
                  onClick={() => void handleAnalyze()}
                  className="btn-primary w-full h-10 rounded mt-4 text-xs tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Sparkles size={12} />
                  {loading ? "AI 分析中..." : "查詢推薦"}
                </button>
              </div>

              {/* Analysis summary */}
              {result && (
                <div
                  className="rounded p-5"
                  style={{ background: "rgba(47,122,86,0.08)", border: "1px solid rgba(47,122,86,0.18)" }}
                >
                  <p className="text-xs tracking-widest text-brand-400 uppercase mb-3">AI 分析結果</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="tag-pill px-2 py-0.5 rounded-full text-xs">{result.analysis.occasion}</span>
                    <span className="tag-pill px-2 py-0.5 rounded-full text-xs">{result.analysis.season}</span>
                    {result.analysis.styleHints.map((h) => (
                      <span key={h} className="tag-pill px-2 py-0.5 rounded-full text-xs">{h}</span>
                    ))}
                  </div>
                  <p className="text-xs text-cream opacity-30">{result.analysis.colorPalette}</p>
                </div>
              )}
            </div>

            {/* Right: results */}
            <div>
              {result ? (
                result.results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <p className="font-display text-3xl font-light text-cream opacity-20 mb-2" style={{ fontStyle: "italic" }}>
                      尚無符合推薦
                    </p>
                    <p className="text-xs text-cream opacity-20">資料庫中暫無符合此風格的穿搭</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {result.results.map((r, i) => (
                      <div
                        key={r.outfitId}
                        className="rec-card rounded overflow-hidden"
                        style={{ background: "#1a1a17", border: "1px solid rgba(245,240,235,0.06)" }}
                      >
                        <div className="relative" style={{ height: "220px" }}>
                          <img
                            src={`https://placehold.co/500x625/1a1a17/2f7a56?text=.`}
                            alt={`推薦穿搭 ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,11,0.7) 0%, transparent 60%)" }} />
                          <div className="absolute top-3 left-3">
                            <span className="font-display text-4xl font-light text-cream opacity-20" style={{ lineHeight: 1 }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-display text-xl font-light text-cream" style={{ fontStyle: "italic" }}>
                            穿搭組合 {i + 1}
                          </p>
                          <p className="text-xs text-cream opacity-40 mt-1 leading-relaxed">
                            {r.reasons.join("、") || "AI 智慧推薦"}
                          </p>
                          <p className="text-xs text-cream opacity-20 mt-1">Score: {r.score.toFixed(2)}</p>
                          <div className="flex gap-2 mt-4 pt-4 border-t hairline">
                            <button className="btn-primary flex-1 h-9 rounded text-xs tracking-widest uppercase">採用</button>
                            <button className="btn-ghost flex-1 h-9 rounded text-xs tracking-widest uppercase">略過</button>
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
                      className="rec-card rounded overflow-hidden opacity-40"
                      style={{ background: "#1a1a17", border: "1px solid rgba(245,240,235,0.06)" }}
                    >
                      <div className="relative" style={{ height: "220px" }}>
                        <div className="w-full h-full" style={{ background: "#1a1a17" }} />
                        <div className="absolute top-3 left-3">
                          <span className="font-display text-4xl font-light text-cream opacity-20" style={{ lineHeight: 1 }}>
                            {card.idx}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-display text-xl font-light text-cream" style={{ fontStyle: "italic" }}>{card.title}</p>
                        <p className="text-xs text-cream opacity-40 mt-1 leading-relaxed">{card.desc}</p>
                        <div className="flex gap-1.5 mt-3">
                          {card.tags.map((tag) => (
                            <span key={tag} className="tag-pill px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t hairline">
                          <button disabled className="btn-primary flex-1 h-9 rounded text-xs tracking-widest uppercase opacity-50">採用</button>
                          <button disabled className="btn-ghost flex-1 h-9 rounded text-xs tracking-widest uppercase">略過</button>
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
